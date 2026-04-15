# CSEDU Club Management System — SDD Mermaid Diagrams
**Formula1 · SDD 01 v1.0**
Render each block at [https://mermaid.live](https://mermaid.live) and export as PNG.
Suggested export width: **1800 px** for full-page figures; **1200 px** for half-page.

---

## Diagram 1 — System Architecture
*Save as: `diag_architecture.png`*

```mermaid
flowchart TB
    subgraph ClientLayer["  Client Layer  "]
        Browser["🖥️ React Frontend\n(Browser)"]
    end

    subgraph GatewayLayer["  Gateway Layer  "]
        GW["API Gateway\nExpress.js · Port 3000\n─────────────────────\nJWT RS256 Verify\nRate Limiting\nRequest Routing"]
    end

    subgraph ServiceLayer["  Microservice Layer  "]
        MS1["MS1 · User & Auth\nExpress · Port 3001\nOwner: Amio Rashid"]
        MS2["MS2 · Election Service\nExpress · Port 3002\nOwner: Syed Naimul Islam"]
        MS3["MS3 · Event / Notice / Media\nExpress · Port 3003\nOwner: Md. Al Habib"]
        MS4["MS4 · Finance / Notify / Log\nExpress · Port 3004\nOwner: Mahmud Hasan Walid"]
    end

    subgraph DataLayer["  Data Layer  "]
        PG[("PostgreSQL 16\n────────────────\nauth schema\nelection schema\ncontent schema\nfinance schema")]
        Redis[("Redis 7\n──────────────\nBullMQ Queues\nnotifications\naudit\nelection-scheduler")]
        FS["📁 Local Filesystem\n/var/uploads\n(Media Storage)"]
    end

    subgraph External["  External  "]
        SMTP["📧 SMTP\nEmail Provider"]
    end

    Browser -->|"HTTPS"| GW

    GW -->|"/auth/*  /users/*"| MS1
    GW -->|"/elections/*"| MS2
    GW -->|"/events/*  /notices/*  /media/*"| MS3
    GW -->|"/budgets/*  /logs/*"| MS4

    MS1 -->|"auth schema"| PG
    MS2 -->|"election schema\n+ cross-schema reads on auth"| PG
    MS3 -->|"content schema"| PG
    MS4 -->|"finance schema"| PG
    MS3 -->|"save / stream files"| FS

    MS1 -->|"emit jobs"| Redis
    MS2 -->|"emit jobs\nscheduled open/close"| Redis
    MS3 -->|"emit jobs"| Redis
    MS4 -->|"consume queues"| Redis
    MS4 -->|"send email"| SMTP

    style MS2 fill:#fff3cd,stroke:#f0ad4e,stroke-width:2px
    style GW  fill:#d4edda,stroke:#28a745,stroke-width:2px
```

---

## Diagram 2 — Auth Flow Sequence
*Save as: `diag_auth_flow.png`*

```mermaid
sequenceDiagram
    autonumber
    participant B  as Browser
    participant GW as API Gateway
    participant M1 as MS1 Auth Service
    participant DB as PostgreSQL (auth)
    participant Q  as BullMQ / Redis

    rect rgb(230,245,255)
        Note over B,Q: LOGIN FLOW
        B  ->> GW: POST /auth/login {email, password}
        GW ->> M1: forward (no JWT check on login)
        M1 ->> DB: SELECT * FROM auth.users WHERE email=$1
        DB -->> M1: user record
        M1 ->> M1: bcrypt.compare(password, hash)
        alt invalid credentials
            M1 -->> GW: 401 Unauthorized
            GW -->> B:  401 {message: "Invalid credentials"}
        else valid credentials
            M1 ->> DB: INSERT INTO auth.refresh_tokens (user_id, token_hash, expires_at)
            DB -->> M1: ok
            M1 -->> GW: 200 {accessToken [RS256 JWT, 15 min], refreshToken}
            GW -->> B:  200 {accessToken, refreshToken}
        end
    end

    rect rgb(230,255,230)
        Note over B,Q: SUBSEQUENT AUTHENTICATED REQUEST
        B  ->> GW: GET /elections {Authorization: Bearer <accessToken>}
        GW ->> GW: jwt.verify(token, RS256_PUBLIC_KEY)\n→ {userId, role, email, ...}
        alt token invalid or expired
            GW -->> B: 401 Unauthorized
        else token valid
            GW ->> GW: Inject X-User-Id, X-User-Role headers
            GW ->> MS2: GET /elections (with injected headers)
            MS2 -->> GW: 200 [election list]
            GW -->> B:  200 [election list]
        end
    end

    rect rgb(255,245,230)
        Note over B,Q: TOKEN REFRESH
        B  ->> GW: POST /auth/refresh {refreshToken}
        GW ->> M1: forward
        M1 ->> DB: SELECT * FROM auth.refresh_tokens\nWHERE token_hash=$1 AND revoked=false\nAND expires_at > NOW()
        DB -->> M1: token record (valid)
        M1 ->> M1: sign new accessToken (RS256)
        M1 -->> GW: 200 {accessToken}
        GW -->> B:  200 {accessToken}
    end
```

---

## Diagram 3 — Vote Critical Path Sequence
*Save as: `diag_vote_sequence.png`*

```mermaid
sequenceDiagram
    autonumber
    participant B   as Browser
    participant GW  as API Gateway
    participant MS2 as MS2 Election Service
    participant DB  as PostgreSQL (election schema)
    participant Q   as BullMQ / Redis

    B  ->> GW:  POST /elections/42/vote {candidateId: 7}
    GW ->> GW:  jwt.verify(token, RS256_PUBLIC_KEY)\n→ userId=100, role=student
    GW ->> MS2: POST /elections/42/vote\n{candidateId:7, X-User-Id:100, X-User-Role:student}

    rect rgb(255,240,230)
        Note over MS2,DB: ATOMIC TRANSACTION (READ COMMITTED + SELECT FOR UPDATE)
        MS2 ->> DB: BEGIN TRANSACTION
        MS2 ->> DB: SELECT election_id FROM election.elections\nWHERE election_id=42\n  AND status='active'\n  AND NOW() BETWEEN start_time AND end_time\nFOR UPDATE
        alt election not active or window expired
            DB -->> MS2: 0 rows
            MS2 ->> DB: ROLLBACK
            MS2 -->> GW: 400 {message: "Election is not currently active"}
            GW -->> B:  400
        else election active
            DB -->> MS2: election row (locked)
            MS2 ->> DB: SELECT log_id FROM election.vote_cast_log\nWHERE election_id=42\n  AND voter_user_id=100\nFOR UPDATE
            alt already voted
                DB -->> MS2: 1 row (voter has voted)
                MS2 ->> DB: ROLLBACK
                MS2 -->> GW: 409 {message: "You have already voted"}
                GW -->> B:  409
            else not yet voted
                DB -->> MS2: 0 rows (safe to proceed)
                MS2 ->> DB: SELECT candidate_id FROM election.candidates\nWHERE candidate_id=7 AND election_id=42
                DB -->> MS2: candidate valid
                MS2 ->> DB: INSERT INTO election.votes\n(election_id, candidate_id, cast_at)\nVALUES (42, 7, NOW())
                Note right of DB: No voter_user_id stored here
                MS2 ->> DB: INSERT INTO election.vote_cast_log\n(election_id, voter_user_id, voted_at)\nVALUES (42, 100, NOW())
                Note right of DB: No candidate_id stored here
                MS2 ->> DB: COMMIT TRANSACTION
                DB -->> MS2: transaction committed
            end
        end
    end

    MS2 ->> Q:  enqueue to audit queue:\n{actor:100, action:'vote.cast',\n target:'election', targetId:42}
    Note over MS2,Q: Fire-and-forget — outside transaction

    MS2 -->> GW: 200 {message: "Vote recorded successfully"}
    GW  -->> B:  200 {message: "Vote recorded successfully"}
    Note over B: Results hidden — UI disables vote button
```

---

## Diagram 4 — Election Scheduler Flowchart
*Save as: `diag_scheduler_flow.png`*

```mermaid
flowchart TD
    A(["Admin: POST /elections\n{title, phase, start_time, end_time, ...}"]) 
    --> B["ElectionController.create"]
    B --> C["ElectionService.create\nINSERT INTO election.elections\nstatus = 'scheduled'"]
    C --> D["SchedulerService.scheduleElection(election)"]

    D --> E["Enqueue BullMQ delayed job\n──────────────────────────\nQueue: election-scheduler\nName: election:open:{id}\nDelay: start_time − NOW()"]
    D --> F["Enqueue BullMQ delayed job\n──────────────────────────\nQueue: election-scheduler\nName: election:close:{id}\nDelay: end_time − NOW()"]

    E --> G[("Redis persists\nboth delayed jobs\n(survive restarts)")]
    F --> G

    G --> H{"Delayed time\nreached?"}

    H -->|"election:open fires"| I["ElectionSchedulerWorker\nUPDATE election.elections\nSET status = 'active'\nWHERE election_id = :id"]
    H -->|"election:close fires"| J["ElectionSchedulerWorker\nUPDATE election.elections\nSET status = 'closed'\nWHERE election_id = :id"]

    I --> K["Enqueue election.announced\nto notifications queue\n(MS4 sends emails to eligible voters)"]
    J --> L["Enqueue election.closed\nto audit queue\n(MS4 writes activity log)"]
    J --> M["ResultService now serves\nfull tally on GET /elections/:id/results"]

    K --> N["MS4 NotificationWorker\nSend announcement emails"]
    L --> O["MS4 AuditWorker\nWrite to finance.activity_logs"]

    style I fill:#d4edda,stroke:#28a745
    style J fill:#f8d7da,stroke:#dc3545
    style G fill:#fff3cd,stroke:#f0ad4e
```

---

## Diagram 5 — BullMQ Event Flow
*Save as: `diag_bullmq_flow.png`*

```mermaid
flowchart LR
    subgraph Producers["Event Producers"]
        P1["MS1\nUser & Auth\n─────────────\nuser.approved\nuser.rejected\naudit.action"]
        P2["MS2\nElection\n─────────────\nelection.announced\naudit.action"]
        P3["MS3\nEvent / Notice\n─────────────\nevent.registered\nvolunteer.decided\naudit.action"]
        P4["MS4 Budget REST\n─────────────\nbudget.decided\naudit.action"]
    end

    subgraph Queues["Redis + BullMQ"]
        NQ[/"notifications\nqueue"/]
        AQ[/"audit\nqueue"/]
        SQ[/"election-scheduler\nqueue (internal to MS2)"/]
    end

    subgraph Workers["MS4 Workers"]
        NW["NotificationWorker\n─────────────────\nRetry: 3 × exp backoff\nProcesses: all notification job types"]
        AW["AuditWorker\n──────────────\nAppend-only writes"]
    end

    subgraph Outputs["Outputs"]
        Email["📧 SMTP\nEmail delivery"]
        Log[("finance.activity_logs\nAudit trail")]
    end

    subgraph MS2Scheduler["MS2 Internal Scheduler"]
        SW["ElectionSchedulerWorker"]
    end

    P1 -->|"user.approved\nuser.rejected"| NQ
    P1 -->|"audit.action"| AQ
    P2 -->|"election.announced"| NQ
    P2 -->|"audit.action"| AQ
    P2 -->|"election:open/:id\nelection:close/:id\n(delayed)"| SQ
    P3 -->|"event.registered\nvolunteer.decided"| NQ
    P3 -->|"audit.action"| AQ
    P4 -->|"budget.decided"| NQ
    P4 -->|"audit.action"| AQ

    NQ --> NW
    AQ --> AW
    SQ --> SW

    NW --> Email
    AW --> Log
    SW -->|"UPDATE election status\nthen emit to NQ / AQ"| NQ
    SW --> AQ

    style NQ fill:#cce5ff,stroke:#004085
    style AQ fill:#d4edda,stroke:#155724
    style SQ fill:#fff3cd,stroke:#856404
```

---

## Diagram 6 — MS1 Module Diagram
*Save as: `diag_ms1_modules.png`*

```mermaid
classDiagram
    class AuthRouter {
        +POST /auth/register
        +POST /auth/login
        +POST /auth/logout
        +POST /auth/refresh
        +POST /auth/forgot-password
        +POST /auth/reset-password/:token
    }
    class UserRouter {
        +GET  /users
        +GET  /users/pending
        +GET  /users/:id
        +PATCH /users/:id/approve
        +PATCH /users/:id/reject
        +PATCH /users/:id/role
        +PATCH /users/:id/revoke
    }
    class AuthController {
        +register(req, res)
        +login(req, res)
        +logout(req, res)
        +refreshToken(req, res)
        +forgotPassword(req, res)
        +resetPassword(req, res)
    }
    class UserController {
        +listUsers(req, res)
        +listPending(req, res)
        +getUser(req, res)
        +approveUser(req, res)
        +rejectUser(req, res)
        +changeRole(req, res)
        +revokeUser(req, res)
    }
    class AuthService {
        +register(data) Promise
        +login(email, password) Promise
        +logout(userId, refreshToken) Promise
        +refresh(rawRefreshToken) Promise
        +forgotPassword(email) Promise
        +resetPassword(rawToken, newPassword) Promise
    }
    class UserService {
        +listAll(filters) Promise
        +getPending() Promise
        +getById(userId) Promise
        +approve(userId) Promise
        +reject(userId, reason) Promise
        +changeRole(userId, role) Promise
        +revoke(userId) Promise
    }
    class UserRepository {
        +findByEmail(email) Promise
        +findById(userId) Promise
        +findByStatus(status) Promise
        +insert(data) Promise
        +updateStatus(userId, status) Promise
        +updateRole(userId, role) Promise
        +updatePassword(userId, hash) Promise
    }
    class TokenRepository {
        +insertRefreshToken(userId, hash, expiresAt) Promise
        +findRefreshToken(hash) Promise
        +deleteRefreshToken(hash) Promise
        +insertResetToken(userId, hash, expiresAt) Promise
        +findResetToken(hash) Promise
        +markResetTokenUsed(tokenId) Promise
    }
    class JWTUtil {
        +signAccessToken(payload) String
        +verifyAccessToken(token) Object
        +generateRefreshToken() String
        +hashToken(rawToken) String
        +getPublicKey() String
    }
    class EmailEventEmitter {
        +emitUserApproved(userId, email, name) void
        +emitUserRejected(userId, email, name, reason) void
    }

    AuthRouter    --> AuthController
    UserRouter    --> UserController
    AuthController --> AuthService
    UserController --> UserService
    AuthService   --> UserRepository
    AuthService   --> TokenRepository
    AuthService   --> JWTUtil
    AuthService   --> EmailEventEmitter
    UserService   --> UserRepository
    UserService   --> EmailEventEmitter
```

---

## Diagram 7 — MS2 Module Diagram
*Save as: `diag_ms2_modules.png`*

```mermaid
classDiagram
    class ElectionRouter {
        +POST   /elections
        +GET    /elections
        +GET    /elections/:id
        +PATCH  /elections/:id
        +POST   /elections/:id/candidates
        +GET    /elections/:id/candidates
        +POST   /elections/:id/vote
        +GET    /elections/:id/results
    }
    class ElectionController {
        +create(req, res)
        +list(req, res)
        +getById(req, res)
        +update(req, res)
        +addCandidate(req, res)
        +listCandidates(req, res)
        +castVote(req, res)
        +getResults(req, res)
    }
    class ElectionService {
        +create(data, adminId) Promise
        +list() Promise
        +getById(electionId) Promise
        +update(electionId, data) Promise
    }
    class VoteService {
        +castVote(electionId, userId, candidateId) Promise
        -checkElectionActive(electionId, client) Promise
        -checkNotVoted(electionId, userId, client) Promise
        -validateCandidate(electionId, candidateId, client) Promise
        -recordVoteAtomic(electionId, userId, candidateId, client) Promise
    }
    class CandidateService {
        +addCandidate(electionId, userId, bio, post) Promise
        +listCandidates(electionId) Promise
    }
    class ResultService {
        +getResults(electionId) Promise
        -assertElectionClosed(electionId) Promise
        -computeTally(electionId) Promise
    }
    class SchedulerService {
        +scheduleElection(election) void
        +cancelSchedule(electionId) Promise
        -enqueueOpenJob(electionId, delayMs) Promise
        -enqueueCloseJob(electionId, delayMs) Promise
    }
    class ElectionSchedulerWorker {
        +process(job) Promise
        -handleOpen(electionId) Promise
        -handleClose(electionId) Promise
    }
    class ElectionRepository {
        +insert(data) Promise
        +findById(id) Promise
        +findAll() Promise
        +updateStatus(id, status) Promise
        +update(id, data) Promise
    }
    class VoteRepository {
        +checkVoteCastLog(electionId, userId, client) Promise
        +insertVote(electionId, candidateId, client) Promise
        +insertVoteCastLog(electionId, userId, client) Promise
        +countVotesByCandidate(electionId) Promise
    }
    class CandidateRepository {
        +insert(data) Promise
        +findByElection(electionId) Promise
        +findById(candidateId) Promise
    }

    ElectionRouter        --> ElectionController
    ElectionController    --> ElectionService
    ElectionController    --> VoteService
    ElectionController    --> CandidateService
    ElectionController    --> ResultService
    ElectionService       --> ElectionRepository
    ElectionService       --> SchedulerService
    SchedulerService      --> ElectionSchedulerWorker
    VoteService           --> VoteRepository
    VoteService           --> ElectionRepository
    CandidateService      --> CandidateRepository
    ResultService         --> ElectionRepository
    ResultService         --> VoteRepository
    ResultService         --> CandidateRepository
```

---

## Diagram 8 — MS3 Module Diagram
*Save as: `diag_ms3_modules.png`*

```mermaid
classDiagram
    class EventRouter {
        +POST   /events
        +GET    /events
        +GET    /events/:id
        +PATCH  /events/:id
        +DELETE /events/:id
        +POST   /events/:id/register
        +POST   /events/:id/volunteer
        +GET    /events/:id/registrations
        +PATCH  /events/:id/volunteers/:vid
    }
    class NoticeRouter {
        +POST  /notices
        +GET   /notices
        +GET   /notices/:id
        +PATCH /notices/:id
    }
    class MediaRouter {
        +POST /media/upload
        +GET  /media
        +GET  /media/:id/file
    }
    class EventController {
        +create(req, res)
        +list(req, res)
        +getById(req, res)
        +update(req, res)
        +cancel(req, res)
        +registerAttendee(req, res)
        +applyVolunteer(req, res)
        +listRegistrations(req, res)
        +manageVolunteer(req, res)
    }
    class NoticeController {
        +publish(req, res)
        +list(req, res)
        +getById(req, res)
        +update(req, res)
    }
    class MediaController {
        +upload(req, res)
        +list(req, res)
        +streamFile(req, res)
    }
    class EventService {
        +create(data, createdBy) Promise
        +list() Promise
        +getById(id) Promise
        +update(id, data, userId) Promise
        +cancel(id, userId) Promise
        +registerAttendee(eventId, userId) Promise
        +applyVolunteer(eventId, userId) Promise
        +manageVolunteer(registrationId, status, managerId) Promise
    }
    class NoticeService {
        +publish(data, authorId) Promise
        +list() Promise
        +getById(id) Promise
        +update(id, data, userId) Promise
    }
    class MediaService {
        +upload(file, uploadedBy, eventId, noticeId) Promise
        +list() Promise
        +getById(id) Promise
        +streamFile(id, res) Promise
    }
    class FileStorageService {
        +save(file) String
        +buildPath(originalName) String
        +stream(filePath, res) void
        +delete(filePath) void
    }
    class EventRepository {
        +insert(data) Promise
        +findAll() Promise
        +findById(id) Promise
        +update(id, data) Promise
        +updateStatus(id, status) Promise
    }
    class EventRegistrationRepository {
        +insert(eventId, userId, type) Promise
        +findByEvent(eventId) Promise
        +findByUserAndEvent(userId, eventId) Promise
        +updateStatus(registrationId, status) Promise
        +countByEvent(eventId) Promise
    }
    class NoticeRepository {
        +insert(data) Promise
        +findAllActive() Promise
        +findById(id) Promise
        +update(id, data) Promise
    }
    class MediaRepository {
        +insert(data) Promise
        +findAll() Promise
        +findById(id) Promise
    }

    EventRouter   --> EventController
    NoticeRouter  --> NoticeController
    MediaRouter   --> MediaController
    EventController  --> EventService
    NoticeController --> NoticeService
    MediaController  --> MediaService
    EventService     --> EventRepository
    EventService     --> EventRegistrationRepository
    NoticeService    --> NoticeRepository
    MediaService     --> MediaRepository
    MediaService     --> FileStorageService
```

---

## Diagram 9 — MS4 Module Diagram
*Save as: `diag_ms4_modules.png`*

```mermaid
classDiagram
    class BudgetRouter {
        +POST  /budgets
        +GET   /budgets
        +GET   /budgets/:id
        +PATCH /budgets/:id/approve
        +PATCH /budgets/:id/reject
        +POST  /budgets/:id/expenditures
        +GET   /budgets/:id/expenditures
    }
    class LogRouter {
        +GET /logs
    }
    class BudgetController {
        +submit(req, res)
        +list(req, res)
        +getById(req, res)
        +approve(req, res)
        +reject(req, res)
        +recordExpenditure(req, res)
        +listExpenditures(req, res)
    }
    class LogController {
        +list(req, res)
    }
    class BudgetService {
        +submit(data, proposedBy) Promise
        +list() Promise
        +getById(id, requesterId, requesterRole) Promise
        +approve(id, adminId) Promise
        +reject(id, adminId, comment) Promise
        +recordExpenditure(budgetId, data, recordedBy) Promise
        +listExpenditures(budgetId) Promise
    }
    class LogService {
        +list(filters) Promise
    }
    class BudgetRepository {
        +insert(data) Promise
        +findAll() Promise
        +findById(id) Promise
        +updateStatus(id, status, adminId, comment) Promise
    }
    class ExpenditureRepository {
        +insert(data) Promise
        +findByBudget(budgetId) Promise
    }
    class LogRepository {
        +insert(logEntry) Promise
        +findAll(filters) Promise
    }
    class NotificationWorker {
        +process(job) Promise
        -handleUserApproved(payload) Promise
        -handleUserRejected(payload) Promise
        -handleElectionAnnounced(payload) Promise
        -handleEventRegistered(payload) Promise
        -handleVolunteerDecided(payload) Promise
        -handleBudgetDecided(payload) Promise
    }
    class AuditWorker {
        +process(job) Promise
        -writeLog(payload) Promise
    }
    class EmailService {
        +send(to, subject, body) Promise
        -createTransport() Transporter
        -renderTemplate(type, data) String
    }

    BudgetRouter --> BudgetController
    LogRouter    --> LogController
    BudgetController --> BudgetService
    LogController    --> LogService
    BudgetService    --> BudgetRepository
    BudgetService    --> ExpenditureRepository
    LogService       --> LogRepository
    NotificationWorker --> EmailService
    AuditWorker        --> LogRepository
```

---

## Diagram 10 — Consolidated ER Diagram
*Save as: `diag_er.png`*

```mermaid
erDiagram

    %% ── auth schema ───────────────────────────────────────────
    AUTH_USERS {
        int     user_id         PK
        varchar name
        varchar email
        text    password_hash
        varchar role
        varchar status
        int     batch_year
        ts      created_at
        ts      updated_at
    }
    AUTH_REFRESH_TOKENS {
        int     token_id    PK
        int     user_id     FK
        text    token_hash
        ts      expires_at
        bool    revoked
        ts      created_at
    }
    AUTH_RESET_TOKENS {
        int     token_id    PK
        int     user_id     FK
        text    token_hash
        ts      expires_at
        bool    used
        ts      created_at
    }

    %% ── election schema ───────────────────────────────────────
    ELECTION_ELECTIONS {
        int     election_id         PK
        varchar title
        int     phase
        varchar status
        text    rules
        int     max_votes_per_user
        ts      start_time
        ts      end_time
        int     created_by
        ts      created_at
    }
    ELECTION_CANDIDATES {
        int     candidate_id    PK
        int     election_id     FK
        int     user_id
        text    bio
        varchar post
        ts      created_at
    }
    ELECTION_VOTES {
        int     vote_id         PK
        int     election_id     FK
        int     candidate_id    FK
        ts      cast_at
    }
    ELECTION_VOTE_CAST_LOG {
        int     log_id          PK
        int     election_id     FK
        int     voter_user_id
        ts      voted_at
    }

    %% ── content schema ────────────────────────────────────────
    CONTENT_EVENTS {
        int     event_id            PK
        varchar title
        text    description
        ts      event_date
        varchar location
        int     volunteers_needed
        varchar status
        int     created_by
        ts      created_at
    }
    CONTENT_EVENT_REGISTRATIONS {
        int     registration_id PK
        int     event_id        FK
        int     user_id
        varchar type
        varchar status
        ts      registered_at
    }
    CONTENT_NOTICES {
        int     notice_id   PK
        varchar title
        text    content
        varchar priority
        date    expiry_date
        int     created_by
        ts      published_at
    }
    CONTENT_MEDIA {
        int     media_id    PK
        text    file_path
        varchar file_type
        int     event_id
        int     notice_id
        int     uploaded_by
        ts      uploaded_at
    }

    %% ── finance schema ────────────────────────────────────────
    FINANCE_BUDGETS {
        int     budget_id       PK
        int     event_id
        int     proposed_by
        varchar status
        dec     total_amount
        jsonb   line_items
        text    admin_comment
        int     reviewed_by
        ts      submitted_at
        ts      reviewed_at
    }
    FINANCE_EXPENDITURES {
        int     expenditure_id  PK
        int     budget_id       FK
        varchar category
        dec     amount
        text    description
        ts      recorded_at
        int     recorded_by
    }
    FINANCE_ACTIVITY_LOGS {
        int     log_id              PK
        int     actor_user_id
        varchar action_type
        varchar target_entity
        int     target_entity_id
        jsonb   details
        ts      logged_at
    }

    %% ── relationships ─────────────────────────────────────────
    AUTH_USERS            ||--o{ AUTH_REFRESH_TOKENS       : "has"
    AUTH_USERS            ||--o{ AUTH_RESET_TOKENS         : "requests"

    ELECTION_ELECTIONS    ||--o{ ELECTION_CANDIDATES       : "has"
    ELECTION_ELECTIONS    ||--o{ ELECTION_VOTES            : "contains"
    ELECTION_ELECTIONS    ||--o{ ELECTION_VOTE_CAST_LOG    : "tracks"
    ELECTION_CANDIDATES   ||--o{ ELECTION_VOTES            : "receives"

    CONTENT_EVENTS        ||--o{ CONTENT_EVENT_REGISTRATIONS : "has"
    CONTENT_EVENTS        ||--o{ CONTENT_MEDIA               : "has"
    CONTENT_NOTICES       ||--o{ CONTENT_MEDIA               : "has"

    FINANCE_BUDGETS       ||--o{ FINANCE_EXPENDITURES      : "tracks"
```

---

## Rendering Tips

| Diagram | Recommended width | Notes |
|---|---|---|
| System Architecture | 1800 px | Use `flowchart TB` layout |
| Auth Flow Sequence | 1400 px | Sequence diagram — tall |
| Vote Critical Path | 1600 px | Sequence diagram — tall |
| Scheduler Flowchart | 1000 px | Narrow vertical flow |
| BullMQ Event Flow | 1600 px | Wide horizontal |
| MS1–MS4 Module Diagrams | 1600 px each | classDiagram — wide |
| ER Diagram | 2000 px | Large — use full width in LaTeX |

After exporting, reference images in `sdd_main.tex` by placing PNG files in the same
directory and using `\includegraphics{diag_architecture.png}` etc.
