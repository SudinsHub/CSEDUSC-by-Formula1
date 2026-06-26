import { Metadata } from 'next';
import EventDetailClient from './EventDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4005';
  
  try {
    const res = await fetch(`${baseUrl}/api/events/${id}`, { next: { revalidate: 10 } });
    if (!res.ok) {
      return {
        title: 'Event Not Found | CSEDU Students\' Club',
      };
    }
    const event = await res.json();
    
    const title = event.title;
    const description = event.description || `Event on ${new Date(event.event_date).toLocaleDateString()} at ${event.location || 'TSC'}`;
    const pageUrl = `${baseUrl}/events/${id}`;
    const imageUrl = event.banner_image_id 
      ? `${baseUrl}/api/media/${event.banner_image_id}/file` 
      : undefined;

    return {
      title: `${title} | CSEDU Students' Club`,
      description,
      openGraph: {
        title,
        description,
        url: pageUrl,
        type: 'article',
        images: imageUrl ? [{ url: imageUrl }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Event Details | CSEDU Students\' Club',
    };
  }
}

export default async function EventPage({ params }: Props) {
  const { id } = await params;
  return <EventDetailClient id={id} />;
}
