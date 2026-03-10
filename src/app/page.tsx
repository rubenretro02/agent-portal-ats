'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  Building2,
  ArrowRight,
  CheckCircle2,
  Globe,
  Shield,
  Zap,
  BarChart3,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-white">
              AP
            </div>
            <span className="text-xl font-bold text-white">AgentHub</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">
                Agent Login
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button className="bg-teal-500 hover:bg-teal-600">
                Admin Portal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/20 rounded-full text-teal-400 text-sm mb-6">
            <Zap className="h-4 w-4" />
            Unified 1099 Agent Platform + ATS
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            The Complete Platform for
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
              1099 Call Center Agents
            </span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Seamlessly integrated Agent Portal and Applicant Tracking System.
            Recruit, onboard, and manage your remote workforce from a single platform.
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="bg-white/5 border-white/10 hover:border-teal-500/50 transition-all group">
            <CardContent className="p-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Agent Portal</h2>
              <p className="text-zinc-400 mb-6">
                For independent contractors. Apply to opportunities, complete onboarding,
                manage documents, and track your earnings.
              </p>
              <ul className="space-y-2 mb-6">
                {['Apply to Opportunities', 'Upload Documents', 'Complete Training', 'Track Earnings'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-zinc-300 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-teal-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/login">
                <Button className="w-full bg-teal-500 hover:bg-teal-600 group-hover:shadow-lg group-hover:shadow-teal-500/25 transition-all">
                  Enter Agent Portal
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 hover:border-cyan-500/50 transition-all group">
            <CardContent className="p-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-6">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">ATS Admin</h2>
              <p className="text-zinc-400 mb-6">
                For recruiters and managers. Manage pipelines, review applications,
                automate workflows, and track metrics.
              </p>
              <ul className="space-y-2 mb-6">
                {['Pipeline Management', 'Document Review', 'Automated Workflows', 'Analytics Dashboard'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-zinc-300 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/admin/login">
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white group-hover:shadow-lg group-hover:shadow-cyan-500/25 transition-all">
                  Enter ATS Portal
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/10 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Native ATS Integration
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: 'Real-time Sync', desc: 'Bidirectional data sync between Portal and ATS' },
              { icon: Globe, title: 'Multi-language', desc: 'Full English and Spanish support' },
              { icon: Shield, title: 'Secure', desc: 'SSO authentication and encrypted documents' },
              { icon: BarChart3, title: 'Analytics', desc: 'Comprehensive metrics and reporting' },
            ].map((feature) => (
              <div key={feature.title} className="text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-teal-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-zinc-500 text-sm">
          <p>AgentHub - 1099 Agent Portal + ATS Platform</p>
          <p className="mt-1">Demo Application - Integrated Recruitment & Operations</p>
        </div>
      </footer>
    </div>
  );
}
