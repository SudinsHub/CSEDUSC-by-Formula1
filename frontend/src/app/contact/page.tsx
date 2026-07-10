'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, MapPin, Phone, Send, Info, Globe } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/api';

interface ContactFormInput {
  name: string;
  email: string;
  message: string;
}

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormInput>();

  const onSubmit = async (data: ContactFormInput) => {
    setSubmitting(true);
    try {
      await api.post('/api/notifications/contact', data);
      toast.success('Your message has been sent successfully!');
      reset();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1">
        
        {/* Banner Section */}
        <section className="bg-navy-900 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold mb-4">
              Get in <span className="text-gold-400">Touch</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
              Have questions about registration, upcoming events, or club elections? Drop us a message, and our team will get back to you shortly.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            
            {/* Contact details: 2 cols */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6 bg-white border border-gray-100 shadow-xs space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-navy-900 mb-2">Club Headquarters</h3>
                  <p className="text-gray-500 text-sm">Official communication details for the CSEDU Students&apos; Club.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-600 flex-shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-navy-800">Address</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Department of Computer Science & Engineering,<br />
                        University of Dhaka, Dhaka-1000, Bangladesh
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-600 flex-shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-navy-800">Email Address</h4>
                      <p className="text-xs text-gray-500 mt-1">csedusc@cse.du.ac.bd</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-600 flex-shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-navy-800">Course / CSE Portal</h4>
                      <p className="text-xs text-gray-500 mt-1">cse.du.ac.bd</p>
                    </div>
                  </div>
                </div>

                <div className="bg-navy-950 text-white rounded-xl p-4 flex gap-3.5 items-start">
                  <Info className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed text-gray-300">
                    <span className="font-bold text-white block mb-0.5">Admin Office Hours</span>
                    Sunday - Thursday: 9:00 AM - 5:00 PM<br />
                    Response times are usually within 24 hours.
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form: 3 cols */}
            <div className="lg:col-span-3">
              <div className="card p-8 bg-white border border-gray-100 shadow-xs">
                <h3 className="text-xl font-bold text-navy-900 mb-1">Send a Message</h3>
                <p className="text-gray-500 text-xs mb-6">Fill in details below and write your enquiry.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label className="label">Full Name</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="John Doe"
                      {...register('name', { required: 'Name is required' })}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="label">Email Address</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="john@example.com"
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="label">Your Message</label>
                    <textarea
                      rows={5}
                      className="input resize-none"
                      placeholder="Write your query in detail..."
                      {...register('message', { 
                        required: 'Message is required',
                        minLength: { value: 10, message: 'Message must be at least 10 characters' }
                      })}
                    />
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full btn-primary py-3 justify-center flex items-center gap-2"
                  >
                    {submitting ? (
                      'Submitting...'
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
