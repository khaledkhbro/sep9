"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/hooks/use-translation"
import { ClearNotifications } from "@/components/notifications/clear-notifications"
import {
  Briefcase,
  ShoppingBag,
  Newspaper,
  TrendingUp,
  Users,
  DollarSign,
  ExternalLink,
  Clock,
  Star,
  Eye,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"
import { getUserDashboardStats, type DashboardStats } from "@/lib/dashboard-stats"
import { LazyImage } from "@/components/ui/lazy-image"

const mockJobsData = [
  {
    id: 1,
    title: "Social Media Content Creation",
    description: "Create engaging posts for Instagram and TikTok",
    price: 25,
    category: "Social Media",
    applicants: 12,
    timeLeft: "2 days",
  },
  {
    id: 2,
    title: "Logo Design for Startup",
    description: "Modern logo design for tech startup",
    price: 150,
    category: "Design",
    applicants: 8,
    timeLeft: "5 days",
  },
  {
    id: 3,
    title: "Website Testing & QA",
    description: "Test website functionality and report bugs",
    price: 75,
    category: "Testing",
    applicants: 15,
    timeLeft: "1 day",
  },
]

const mockMarketplaceData = [
  {
    id: 1,
    title: "Professional Video Editing",
    seller: "VideoProMax",
    rating: 4.9,
    reviews: 234,
    price: 50,
    deliveryTime: "2 days",
    thumbnail: "/placeholder.svg?height=160&width=240&text=Video+Editing",
  },
  {
    id: 2,
    title: "Custom Web Development",
    seller: "DevExpert",
    rating: 4.8,
    reviews: 156,
    price: 200,
    deliveryTime: "7 days",
    thumbnail: "/placeholder.svg?height=160&width=240&text=Web+Dev",
  },
  {
    id: 3,
    title: "SEO Content Writing",
    seller: "ContentKing",
    rating: 4.7,
    reviews: 89,
    price: 30,
    deliveryTime: "3 days",
    thumbnail: "/placeholder.svg?height=160&width=240&text=SEO+Writing",
  },
]

const mockEarningsNewsData = [
  {
    id: 1,
    title: "Top 10 Freelancing Trends for 2024",
    excerpt: "Discover the latest trends shaping the freelance economy and how to capitalize on them.",
    author: "Sarah Johnson",
    readTime: "5 min read",
    category: "Trends",
    publishedAt: "2 hours ago",
    views: 1234,
  },
  {
    id: 2,
    title: "How to Increase Your Hourly Rate by 50%",
    excerpt: "Proven strategies to command higher rates and attract premium clients.",
    author: "Mike Chen",
    readTime: "8 min read",
    category: "Earnings",
    publishedAt: "1 day ago",
    views: 2156,
  },
  {
    id: 3,
    title: "Building a Personal Brand as a Freelancer",
    excerpt: "Essential tips for creating a strong personal brand that attracts clients.",
    author: "Emma Davis",
    readTime: "6 min read",
    category: "Branding",
    publishedAt: "3 days ago",
    views: 987,
  },
]

export default function DashboardPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    activeJobs: 0,
    completedJobs: 0,
    pendingApplications: 0,
  })
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return

      try {
        console.log("[v0] Loading dashboard stats for user:", user.id)
        const realStats = await getUserDashboardStats(user.id)
        console.log("[v0] Dashboard stats loaded:", realStats)
        setStats(realStats)
      } catch (error) {
        console.error("[v0] Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    if (typeof window !== "undefined") {
      localStorage.removeItem("notification-counts")
      console.log("[v0] Cleared notification counts from localStorage")
    }
  }, [user?.id])

  if (loading) {
    return (
      <>
        <DashboardHeader
          title={t("dashboard.title")}
          description="Welcome back! Here's what's happening across all platforms."
        />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center animate-pulse shadow-2xl">
              <TrendingUp className="h-10 w-10 text-white animate-spin" />
            </div>
            <p className="text-lg font-semibold text-primary">{t("common.loading")}</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader
        title={t("dashboard.title")}
        description="Welcome back! Here's what's happening across all platforms."
      />

      <div className="flex-1 overflow-auto bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex justify-end">
            <ClearNotifications />
          </div>

          <div className="stats-grid mb-8">
            <div className="platform-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <StatsCard
                title="Total Earnings"
                value={`$${stats.totalEarnings.toFixed(2)}`}
                description="Across all platforms"
                icon={DollarSign}
                trend={{ value: stats.totalEarnings > 0 ? 12.5 : 0, isPositive: stats.totalEarnings > 0 }}
              />
            </div>
            <div className="platform-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <StatsCard
                title="Active Projects"
                value={stats.activeJobs + 3}
                description="Jobs + Services"
                icon={Briefcase}
                trend={{ value: stats.activeJobs > 0 ? 8.2 : 0, isPositive: stats.activeJobs > 0 }}
              />
            </div>
            <div className="platform-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <StatsCard
                title="Total Views"
                value="2.4K"
                description="Profile & content views"
                icon={Eye}
                trend={{ value: 15.3, isPositive: true }}
              />
            </div>
            <div className="platform-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <StatsCard
                title="Messages"
                value="12"
                description="Unread conversations"
                icon={MessageCircle}
                trend={{ value: 5.7, isPositive: true }}
              />
            </div>
          </div>

          <div className="preview-grid mb-8">
            {/* Jobs Platform */}
            <Card className="platform-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="platform-header rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-foreground">Microjobs</CardTitle>
                      <p className="text-sm text-muted-foreground">Quick tasks & gigs</p>
                    </div>
                  </div>
                  <Link href="/jobs">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                    >
                      View All <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {mockJobsData.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-accent/10 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground truncate">{job.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{job.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {job.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {job.applicants}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {job.timeLeft}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <div className="font-bold text-primary">${job.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Available Jobs</span>
                    <span className="font-medium text-primary">24 new today</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Marketplace Platform */}
            <Card className="platform-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="platform-header rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-foreground">Marketplace</CardTitle>
                      <p className="text-sm text-muted-foreground">Professional services</p>
                    </div>
                  </div>
                  <Link href="/marketplace">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    >
                      Browse <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {mockMarketplaceData.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center space-x-3 p-3 bg-muted rounded-lg hover:bg-accent/10 transition-colors"
                    >
                      <LazyImage
                        src={service.thumbnail}
                        alt={service.title}
                        width={48}
                        height={36}
                        className="w-12 h-9 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground truncate">{service.title}</h4>
                        <p className="text-xs text-muted-foreground">by {service.seller}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-muted-foreground ml-1">
                              {service.rating} ({service.reviews})
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">{service.deliveryTime}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">${service.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Featured Services</span>
                    <span className="font-medium text-primary">156 available</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Earnings News Platform */}
            <Card className="platform-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="platform-header rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Newspaper className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-foreground">Earnings News</CardTitle>
                      <p className="text-sm text-muted-foreground">Tips & insights</p>
                    </div>
                  </div>
                  <Link href="/earnings-news">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                    >
                      Read More <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {mockEarningsNewsData.map((article) => (
                    <div key={article.id} className="p-3 bg-muted rounded-lg hover:bg-accent/10 transition-colors">
                      <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-1">{article.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{article.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            {article.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{article.readTime}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          <span>{article.views}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Latest Articles</span>
                    <span className="font-medium text-primary">8 new this week</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="platform-card rounded-xl shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <TrendingUp className="h-6 w-6 text-primary mr-3" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/dashboard/jobs/create">
                  <Button className="w-full h-16 bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white flex flex-col items-center justify-center space-y-1 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                    <Briefcase className="h-5 w-5" />
                    <span className="text-sm font-bold">Post a Job</span>
                  </Button>
                </Link>
                <Link href="/dashboard/services/create">
                  <Button className="w-full h-16 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white flex flex-col items-center justify-center space-y-1 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                    <ShoppingBag className="h-5 w-5" />
                    <span className="text-sm font-bold">Create Service</span>
                  </Button>
                </Link>
                <Link href="/dashboard/wallet">
                  <Button className="w-full h-16 bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white flex flex-col items-center justify-center space-y-1 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                    <DollarSign className="h-5 w-5" />
                    <span className="text-sm font-bold">View Wallet</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
