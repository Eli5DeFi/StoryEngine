'use client'

import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp, Users, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FeaturedStories() {
  const stories = [
    {
      id: 1,
      title: 'The Last Starforge',
      genre: 'Sci-Fi',
      description: 'A derelict space station holds the secret to humanity\'s survival. But which path will the AI choose?',
      poolSize: '142.5K',
      bettors: 847,
      timeLeft: '4h 23m',
      image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      id: 2,
      title: 'Echoes of the Void',
      genre: 'Fantasy',
      description: 'Ancient magic awakens in a world of forgotten gods. The AI faces an impossible choice.',
      poolSize: '98.3K',
      bettors: 623,
      timeLeft: '2h 15m',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      id: 3,
      title: 'Neon Prophecy',
      genre: 'Cyberpunk',
      description: 'In a dystopian megacity, a hacker discovers a conspiracy. What will the AI decide?',
      poolSize: '76.8K',
      bettors: 512,
      timeLeft: '6h 42m',
      image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&q=80',
      gradient: 'from-orange-500 to-red-500',
    },
  ]

  return (
    <section id="stories" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Featured <span className="text-gradient">Stories</span>
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Active betting pools with the highest engagement. Join thousands of readers shaping these narratives.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-card border border-border rounded-xl overflow-hidden card-hover"
            >
              {/* Image header with gradient overlay */}
              <div className="relative h-48 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${story.gradient} opacity-60 group-hover:opacity-80 transition-opacity`} />
                <div className="absolute top-4 left-4 px-3 py-1 bg-background/80 backdrop-blur rounded-full text-xs font-medium">
                  {story.genre}
                </div>
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-red-500/80 backdrop-blur rounded-full text-xs font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {story.timeLeft}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {story.title}
                </h3>
                <p className="text-foreground/70 mb-4 text-sm leading-relaxed">
                  {story.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-foreground/60">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground">{story.poolSize} $FORGE</span>
                    </div>
                    <div className="flex items-center gap-1 text-foreground/60">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span className="font-medium text-foreground">{story.bettors}</span>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <Button className="w-full bg-primary hover:bg-primary/90 group-hover:glow transition-all">
                  Place Bet
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View all button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Button
            size="lg"
            variant="outline"
            className="border-primary/50 hover:bg-primary/10"
          >
            View All Stories
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
