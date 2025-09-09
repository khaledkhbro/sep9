"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Search,
  ArrowRight,
  Briefcase,
  Palette,
  Code,
  Camera,
  Music,
  Megaphone,
  Star,
  Clock,
  CheckCircle,
  Users,
  Globe,
  ChevronRight,
  Play,
  Award,
  Sparkles,
} from "lucide-react"
import { useState } from "react"

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("all")

  const categories = [
    { icon: Code, name: "Programming", count: "2.5k+", color: "bg-blue-500" },
    { icon: Palette, name: "Design", count: "1.8k+", color: "bg-purple-500" },
    { icon: Camera, name: "Photography", count: "950+", color: "bg-pink-500" },
    { icon: Music, name: "Audio", count: "720+", color: "bg-orange-500" },
    { icon: Megaphone, name: "Marketing", count: "1.2k+", color: "bg-red-500" },
    { icon: Briefcase, name: "Business", count: "890+", color: "bg-indigo-500" },
    { icon: Globe, name: "Translation", count: "650+", color: "bg-green-500" },
    { icon: Users, name: "Social Media", count: "1.1k+", color: "bg-teal-500" },
  ]

  const featuredServices = [
    {
      image: "/logo-design-portfolio.png",
      seller: "Sarah_Designer",
      level: "Pro",
      rating: 4.9,
      reviews: 127,
      title: "I will design a stunning modern logo for your brand",
      price: "$25",
      deliveryTime: "2 days",
      category: "Design",
    },
    {
      image: "/website-development.png",
      seller: "CodeMaster_Pro",
      level: "Expert",
      rating: 5.0,
      reviews: 89,
      title: "I will develop a responsive website with modern design",
      price: "$150",
      deliveryTime: "5 days",
      category: "Programming",
    },
    {
      image: "/video-editing-workspace.png",
      seller: "VideoWiz_24",
      level: "Rising",
      rating: 4.8,
      reviews: 45,
      title: "I will edit your video with professional effects",
      price: "$35",
      deliveryTime: "3 days",
      category: "Video",
    },
    {
      image: "/content-writing-concept.png",
      seller: "WriteExpert",
      level: "Pro",
      rating: 4.9,
      reviews: 203,
      title: "I will write engaging blog content that converts",
      price: "$20",
      deliveryTime: "1 day",
      category: "Writing",
    },
  ]

  const stats = [
    { label: "Active Users", value: "2.5M+", icon: Users },
    { label: "Jobs Completed", value: "15M+", icon: CheckCircle },
    { label: "Countries", value: "190+", icon: Globe },
    { label: "Avg. Rating", value: "4.9/5", icon: Star },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Briefcase className="text-white h-5 w-5" />
              </div>
              <span className="text-2xl font-bold text-foreground">WorkHub</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/marketplace" className="text-muted-foreground hover:text-foreground transition-colors">
                Browse Services
              </Link>
              <Link href="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </Link>
              <Link href="/become-seller" className="text-muted-foreground hover:text-foreground transition-colors">
                Become a Seller
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Join Now</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10"></div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 fade-in-up">
              <Sparkles className="h-4 w-4" />
              <span>Trusted by 2.5M+ professionals worldwide</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 fade-in-up text-balance">
              Find the perfect
              <span className="text-gradient block">freelance services</span>
              for your business
            </h1>

            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto fade-in-up text-pretty">
              Connect with talented freelancers and get your projects done with quality and speed. From quick tasks to
              complex projects.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-12 fade-in-up">
              <div className="relative">
                <div className="flex bg-white rounded-2xl shadow-lg border border-border p-2">
                  <Input
                    placeholder="What service are you looking for today?"
                    className="flex-1 border-0 text-lg py-4 px-6 bg-transparent focus:ring-0"
                  />
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 rounded-xl">
                    <Search className="h-5 w-5 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </div>

            {/* Popular searches */}
            <div className="flex flex-wrap justify-center gap-3 mb-12 fade-in-up">
              <span className="text-muted-foreground">Popular:</span>
              {["Logo Design", "WordPress", "Voice Over", "Video Editing", "Social Media"].map((term) => (
                <Button key={term} variant="outline" size="sm" className="rounded-full bg-transparent">
                  {term}
                </Button>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in-up">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg group bg-transparent">
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Explore by Category</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Browse our most popular service categories and find the perfect match for your project
            </p>
          </div>

          <div className="smart-grid">
            {categories.map((category, index) => (
              <Card key={index} className="modern-card group cursor-pointer">
                <CardContent className="p-8 text-center">
                  <div
                    className={`w-16 h-16 ${category.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}
                  >
                    <category.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{category.name}</h3>
                  <p className="text-muted-foreground mb-4">{category.count} services available</p>
                  <Button variant="ghost" className="group-hover:bg-primary/10 group-hover:text-primary">
                    Explore
                    <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Featured Services</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Hand-picked services from our top-rated sellers
            </p>
          </div>

          <div className="smart-grid">
            {featuredServices.map((service, index) => (
              <Card key={index} className="modern-card group cursor-pointer overflow-hidden">
                <div className="relative">
                  <img
                    src={service.image || "/placeholder.svg"}
                    alt={service.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">{service.category}</Badge>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{service.seller.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{service.seller}</p>
                      <p className="text-sm text-muted-foreground">{service.level} Seller</p>
                    </div>
                  </div>

                  <h3 className="font-semibold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>

                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="ml-1 text-sm font-medium">{service.rating}</span>
                      <span className="ml-1 text-sm text-muted-foreground">({service.reviews})</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="text-sm">{service.deliveryTime}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-foreground">Starting at {service.price}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How WorkHub Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get your project done in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                icon: Search,
                title: "Find the Right Service",
                description: "Browse through thousands of services or post your project requirements",
              },
              {
                step: "02",
                icon: Users,
                title: "Work with Experts",
                description: "Collaborate with skilled freelancers and track your project progress",
              },
              {
                step: "03",
                icon: Award,
                title: "Get Results",
                description: "Receive high-quality work on time and leave feedback for the community",
              },
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <item.icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Join millions of people who use WorkHub to turn their ideas into reality
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="px-8 py-4 text-lg">
              Start as a Buyer
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-primary bg-transparent"
            >
              Become a Seller
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <Link href="/" className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
                  <Briefcase className="text-white h-5 w-5" />
                </div>
                <span className="text-2xl font-bold">WorkHub</span>
              </Link>
              <p className="text-muted-foreground mb-6">
                Connecting talent with opportunity worldwide. Build your business with confidence.
              </p>
              <div className="flex space-x-4">
                {["f", "t", "in", "ig"].map((social) => (
                  <div
                    key={social}
                    className="w-10 h-10 bg-muted/10 rounded-lg flex items-center justify-center hover:bg-primary transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-bold">{social}</span>
                  </div>
                ))}
              </div>
            </div>

            {[
              {
                title: "For Clients",
                links: ["Post a Project", "Browse Services", "How It Works", "Pricing"],
              },
              {
                title: "For Freelancers",
                links: ["Find Work", "Create Profile", "Success Stories", "Resources"],
              },
              {
                title: "Support",
                links: ["Help Center", "Contact Us", "Terms of Service", "Privacy Policy"],
              },
            ].map((section, index) => (
              <div key={index}>
                <h3 className="font-semibold mb-6">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-muted-foreground hover:text-background transition-colors">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-muted/20 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground">© 2024 WorkHub. All rights reserved.</p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <select className="bg-muted/10 border border-muted/20 rounded-lg px-3 py-2 text-sm">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
              <select className="bg-muted/10 border border-muted/20 rounded-lg px-3 py-2 text-sm">
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
              </select>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
