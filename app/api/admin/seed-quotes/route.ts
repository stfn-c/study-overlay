import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface QuoteData {
  text: string
  author: string
}

interface QuoteSetData {
  name: string
  description: string
  quotes: QuoteData[]
}

const defaultQuoteSets: QuoteSetData[] = [
  {
    name: 'Study & Learning',
    description: 'Motivational quotes focused on studying, education, and continuous learning',
    quotes: [
      { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
      { text: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
      { text: 'Education is the most powerful weapon which you can use to change the world.', author: 'Nelson Mandela' },
      { text: 'The beautiful thing about learning is that no one can take it away from you.', author: 'B.B. King' },
      { text: 'Learning is not attained by chance, it must be sought for with ardor and attended to with diligence.', author: 'Abigail Adams' },
      { text: 'The more that you read, the more things you will know. The more that you learn, the more places you\'ll go.', author: 'Dr. Seuss' },
      { text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
      { text: 'Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.', author: 'Richard Feynman' },
      { text: 'The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.', author: 'Brian Herbert' },
      { text: 'Live as if you were to die tomorrow. Learn as if you were to live forever.', author: 'Mahatma Gandhi' },
      { text: 'Tell me and I forget. Teach me and I remember. Involve me and I learn.', author: 'Benjamin Franklin' },
      { text: 'The only source of knowledge is experience.', author: 'Albert Einstein' },
      { text: 'Anyone who stops learning is old, whether at twenty or eighty.', author: 'Henry Ford' },
      { text: 'Learning never exhausts the mind.', author: 'Leonardo da Vinci' },
      { text: 'In learning you will teach, and in teaching you will learn.', author: 'Phil Collins' },
      { text: 'Education is not preparation for life; education is life itself.', author: 'John Dewey' },
      { text: 'The mind is not a vessel to be filled, but a fire to be kindled.', author: 'Plutarch' },
      { text: 'Intellectual growth should commence at birth and cease only at death.', author: 'Albert Einstein' },
      { text: 'Wisdom is not a product of schooling but of the lifelong attempt to acquire it.', author: 'Albert Einstein' },
      { text: 'You don\'t understand anything until you learn it more than one way.', author: 'Marvin Minsky' },
      { text: 'Study without desire spoils the memory, and it retains nothing that it takes in.', author: 'Leonardo da Vinci' },
      { text: 'The roots of education are bitter, but the fruit is sweet.', author: 'Aristotle' },
      { text: 'Knowledge is power. Information is liberating.', author: 'Kofi Annan' },
      { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb' },
      { text: 'It is impossible for a man to learn what he thinks he already knows.', author: 'Epictetus' },
      { text: 'The important thing is not to stop questioning. Curiosity has its own reason for existing.', author: 'Albert Einstein' },
      { text: 'A person who never made a mistake never tried anything new.', author: 'Albert Einstein' },
      { text: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' },
      { text: 'We learn from failure, not from success.', author: 'Bram Stoker' },
      { text: 'Don\'t let what you cannot do interfere with what you can do.', author: 'John Wooden' },
    ],
  },
  {
    name: 'Motivation & Inspiration',
    description: 'Powerful quotes to inspire action and maintain motivation',
    quotes: [
      { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
      { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
      { text: 'Don\'t watch the clock; do what it does. Keep going.', author: 'Sam Levenson' },
      { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
      { text: 'It always seems impossible until it\'s done.', author: 'Nelson Mandela' },
      { text: 'Start where you are. Use what you have. Do what you can.', author: 'Arthur Ashe' },
      { text: 'The only impossible journey is the one you never begin.', author: 'Tony Robbins' },
      { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
      { text: 'What you get by achieving your goals is not as important as what you become by achieving your goals.', author: 'Zig Ziglar' },
      { text: 'You are never too old to set another goal or to dream a new dream.', author: 'C.S. Lewis' },
      { text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
      { text: 'Your time is limited, don\'t waste it living someone else\'s life.', author: 'Steve Jobs' },
      { text: 'If life were predictable it would cease to be life, and be without flavor.', author: 'Eleanor Roosevelt' },
      { text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
      { text: 'The only limit to our realization of tomorrow will be our doubts of today.', author: 'Franklin D. Roosevelt' },
      { text: 'Do not wait to strike till the iron is hot; but make it hot by striking.', author: 'William Butler Yeats' },
      { text: 'Whether you think you can or you think you can\'t, you\'re right.', author: 'Henry Ford' },
      { text: 'The best revenge is massive success.', author: 'Frank Sinatra' },
      { text: 'I have not failed. I\'ve just found 10,000 ways that won\'t work.', author: 'Thomas Edison' },
      { text: 'The person who says it cannot be done should not interrupt the person who is doing it.', author: 'Chinese Proverb' },
      { text: 'There are no limits to what you can accomplish, except the limits you place on your own thinking.', author: 'Brian Tracy' },
      { text: 'You miss 100% of the shots you don\'t take.', author: 'Wayne Gretzky' },
      { text: 'Strive not to be a success, but rather to be of value.', author: 'Albert Einstein' },
      { text: 'I attribute my success to this: I never gave or took any excuse.', author: 'Florence Nightingale' },
      { text: 'The question isn\'t who is going to let me; it\'s who is going to stop me.', author: 'Ayn Rand' },
      { text: 'If you\'re offered a seat on a rocket ship, don\'t ask what seat! Just get on.', author: 'Sheryl Sandberg' },
      { text: 'It is during our darkest moments that we must focus to see the light.', author: 'Aristotle' },
      { text: 'The only person you are destined to become is the person you decide to be.', author: 'Ralph Waldo Emerson' },
      { text: 'You define your own life. Don\'t let other people write your script.', author: 'Oprah Winfrey' },
      { text: 'You don\'t have to be great to start, but you have to start to be great.', author: 'Zig Ziglar' },
    ],
  },
]

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // For security, you might want to check if user is an admin
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let totalSets = 0
    let totalQuotes = 0

    for (const setData of defaultQuoteSets) {
      // Check if set already exists
      const { data: existing } = await supabase
        .from('quote_sets')
        .select('id')
        .eq('name', setData.name)
        .eq('is_default', 1)
        .single()

      if (existing) {
        console.log(`Quote set "${setData.name}" already exists, skipping...`)
        continue
      }

      // Create the quote set (without user_id, making it a default set)
      const { data: quoteSet, error: setError } = await supabase
        .from('quote_sets')
        .insert({
          name: setData.name,
          description: setData.description,
          user_id: null,
          is_default: 1,
        })
        .select()
        .single()

      if (setError) {
        console.error(`Error creating quote set ${setData.name}:`, setError)
        continue
      }

      totalSets++

      // Add all quotes to the set
      const quotesToInsert = setData.quotes.map((quote) => ({
        quote_set_id: quoteSet.id,
        text: quote.text,
        author: quote.author,
      }))

      const { error: quotesError } = await supabase
        .from('quotes')
        .insert(quotesToInsert)

      if (quotesError) {
        console.error(`Error adding quotes to ${setData.name}:`, quotesError)
        continue
      }

      totalQuotes += quotesToInsert.length
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${totalSets} quote sets with ${totalQuotes} total quotes`,
      sets: totalSets,
      quotes: totalQuotes,
    })
  } catch (error) {
    console.error('Failed to seed quotes:', error)
    return NextResponse.json(
      { error: 'Failed to seed quotes' },
      { status: 500 }
    )
  }
}
