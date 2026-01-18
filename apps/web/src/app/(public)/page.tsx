import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Smartphone,
  Shield,
  Package,
  FolderTree,
  Lock,
  Zap,
  Globe,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "Device Management",
    description:
      "Monitor and manage all your devices from a single dashboard. Track device status, location, and health in real-time.",
  },
  {
    icon: Shield,
    title: "Security Policies",
    description:
      "Enforce security policies across your fleet. Configure password requirements, encryption, and remote wipe capabilities.",
  },
  {
    icon: Package,
    title: "App Distribution",
    description:
      "Deploy and manage applications at scale. Push updates, configure app settings, and track installations.",
  },
  {
    icon: FolderTree,
    title: "Group Management",
    description:
      "Organize devices into groups for targeted management. Apply policies and deploy apps to specific groups.",
  },
  {
    icon: Lock,
    title: "Kiosk Mode",
    description:
      "Lock devices to specific apps for dedicated use cases. Perfect for retail, hospitality, and field operations.",
  },
  {
    icon: Zap,
    title: "Remote Commands",
    description:
      "Execute commands remotely across your device fleet. Lock, wipe, reboot, and more with a single click.",
  },
];

const steps = [
  {
    step: "01",
    title: "Connect Your Devices",
    description:
      "Enroll devices using our mobile agent. Supports Android devices with easy QR code enrollment.",
  },
  {
    step: "02",
    title: "Configure Policies",
    description:
      "Create and assign security policies. Set password requirements, configure restrictions, and enable features.",
  },
  {
    step: "03",
    title: "Deploy & Manage",
    description:
      "Push applications, execute commands, and monitor your fleet. All from a beautiful, intuitive dashboard.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 md:px-6 py-24 md:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 backdrop-blur-sm px-4 py-1.5 text-sm font-medium mb-8">
              <Globe className="h-4 w-4 text-primary" />
              <span>Open Source MDM Solution</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-6">
              Modern Device Management,{" "}
              <span className="text-gradient">Simplified</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Manage, secure, and monitor your mobile device fleet with
              OpenMDM. Enterprise-grade features with the flexibility of open
              source.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="rounded-xl text-base px-8 glow-primary">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl text-base px-8"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Everything You Need to Manage Devices
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful features designed for modern enterprise mobility
              management.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="rounded-2xl border-border/50 hover-lift"
              >
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to take control of your device fleet.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((item, index) => (
              <div key={item.step} className="relative">
                <div className="text-7xl font-bold text-primary/10 absolute -top-4 -left-2">
                  {item.step}
                </div>
                <div className="relative pt-8 pl-4">
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 right-0 translate-x-1/2 w-8 h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Start free, scale as you grow. No hidden fees.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {/* Free Tier */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>Perfect for getting started</CardDescription>
                <div className="text-4xl font-bold pt-4">
                  $0<span className="text-lg font-normal text-muted-foreground">/mo</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {["Up to 5 devices", "Basic policies", "App management", "Community support"].map(
                    (feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    )
                  )}
                </ul>
                <Link href="/register" className="block mt-8">
                  <Button variant="outline" className="w-full rounded-xl">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Tier */}
            <Card className="rounded-2xl border-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Popular
                </span>
              </div>
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription>For growing teams</CardDescription>
                <div className="text-4xl font-bold pt-4">
                  $29<span className="text-lg font-normal text-muted-foreground">/mo</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "Up to 100 devices",
                    "Advanced policies",
                    "Kiosk mode",
                    "Remote commands",
                    "Priority support",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block mt-8">
                  <Button className="w-full rounded-xl glow-primary-sm">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Enterprise Tier */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>For large organizations</CardDescription>
                <div className="text-4xl font-bold pt-4">Custom</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "Unlimited devices",
                    "Custom policies",
                    "SSO & SAML",
                    "API access",
                    "Dedicated support",
                    "On-premise option",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <a href="mailto:sales@openmdm.dev" className="block mt-8">
                  <Button variant="outline" className="w-full rounded-xl">
                    Contact Sales
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <Card className="rounded-3xl bg-primary text-primary-foreground overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
            <CardContent className="relative p-12 md:p-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Ready to Take Control of Your Devices?
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Join thousands of organizations managing their mobile devices
                with OpenMDM. Get started in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="rounded-xl text-base px-8"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-xl text-base px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
