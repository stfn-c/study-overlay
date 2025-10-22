import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// This file seeds the database with default quote sets
// Run with: psql <connection-string> -c "INSERT INTO ..." or manually via Supabase dashboard
// Alternatively, create an API endpoint to seed data (recommended for production)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('SUPABASE_KEY:', supabaseKey ? 'Set' : 'Missing')
  throw new Error('Missing Supabase environment variables. You need either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

console.log('Using service role key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})

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
      { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
      { text: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' },
      { text: 'We learn from failure, not from success.', author: 'Bram Stoker' },
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
      { text: 'A person who never made a mistake never tried anything new.', author: 'Albert Einstein' },
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
    ],
  },
  {
    name: 'Success & Achievement',
    description: 'Quotes about success, achievement, and reaching your goals',
    quotes: [
      { text: 'Success is not the key to happiness. Happiness is the key to success.', author: 'Albert Schweitzer' },
      { text: 'Success usually comes to those who are too busy to be looking for it.', author: 'Henry David Thoreau' },
      { text: 'The road to success and the road to failure are almost exactly the same.', author: 'Colin R. Davis' },
      { text: 'Success is walking from failure to failure with no loss of enthusiasm.', author: 'Winston Churchill' },
      { text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
      { text: 'Don\'t be afraid to give up the good to go for the great.', author: 'John D. Rockefeller' },
      { text: 'Success is not how high you have climbed, but how you make a positive difference to the world.', author: 'Roy T. Bennett' },
      { text: 'Success is liking yourself, liking what you do, and liking how you do it.', author: 'Maya Angelou' },
      { text: 'Success seems to be connected with action. Successful people keep moving.', author: 'Conrad Hilton' },
      { text: 'The secret of success is to do the common thing uncommonly well.', author: 'John D. Rockefeller Jr.' },
      { text: 'I find that the harder I work, the more luck I seem to have.', author: 'Thomas Jefferson' },
      { text: 'Success is the sum of small efforts, repeated day in and day out.', author: 'Robert Collier' },
      { text: 'The difference between who you are and who you want to be is what you do.', author: 'Bill Phillips' },
      { text: 'Success is not final; failure is not fatal: It is the courage to continue that counts.', author: 'Winston S. Churchill' },
      { text: 'The successful warrior is the average man, with laser-like focus.', author: 'Bruce Lee' },
      { text: 'Success is doing ordinary things extraordinarily well.', author: 'Jim Rohn' },
      { text: 'You know you are on the road to success if you would do your job, and not be paid for it.', author: 'Oprah Winfrey' },
      { text: 'Success is getting what you want. Happiness is wanting what you get.', author: 'Dale Carnegie' },
      { text: 'The only place where success comes before work is in the dictionary.', author: 'Vidal Sassoon' },
      { text: 'Don\'t aim for success if you want it; just do what you love and believe in, and it will come naturally.', author: 'David Frost' },
      { text: 'Success is a journey, not a destination. The doing is often more important than the outcome.', author: 'Arthur Ashe' },
      { text: 'All you need in this life is ignorance and confidence; then success is sure.', author: 'Mark Twain' },
      { text: 'Success is peace of mind, which is a direct result of self-satisfaction.', author: 'John Wooden' },
      { text: 'The secret to success is to know something nobody else knows.', author: 'Aristotle Onassis' },
      { text: 'Success doesn\'t just find you. You have to go out and get it.', author: 'Anonymous' },
      { text: 'Opportunities don\'t happen. You create them.', author: 'Chris Grosser' },
      { text: 'Try not to become a person of success, but rather try to become a person of value.', author: 'Albert Einstein' },
      { text: 'Success is how high you bounce when you hit bottom.', author: 'George S. Patton' },
      { text: 'If you really look closely, most overnight successes took a long time.', author: 'Steve Jobs' },
      { text: 'The whole secret of a successful life is to find out what is one\'s destiny to do, and then do it.', author: 'Henry Ford' },
    ],
  },
  {
    name: 'Productivity & Focus',
    description: 'Quotes to enhance focus, productivity, and efficient work habits',
    quotes: [
      { text: 'Productivity is never an accident. It is always the result of a commitment to excellence.', author: 'Paul J. Meyer' },
      { text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
      { text: 'Until we can manage time, we can manage nothing else.', author: 'Peter Drucker' },
      { text: 'The key is not to prioritize what\'s on your schedule, but to schedule your priorities.', author: 'Stephen Covey' },
      { text: 'You don\'t have to be great to start, but you have to start to be great.', author: 'Zig Ziglar' },
      { text: 'Amateurs sit and wait for inspiration, the rest of us just get up and go to work.', author: 'Stephen King' },
      { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
      { text: 'Action is the foundational key to all success.', author: 'Pablo Picasso' },
      { text: 'You may delay, but time will not.', author: 'Benjamin Franklin' },
      { text: 'One today is worth two tomorrows.', author: 'Benjamin Franklin' },
      { text: 'Lost time is never found again.', author: 'Benjamin Franklin' },
      { text: 'The bad news is time flies. The good news is you\'re the pilot.', author: 'Michael Altshuler' },
      { text: 'The most efficient way to live reasonably is every morning to make a plan of one\'s day.', author: 'Alexis Carrel' },
      { text: 'It\'s not always that we need to do more but rather that we need to focus on less.', author: 'Nathan W. Morris' },
      { text: 'The shorter way to do many things is to only do one thing at a time.', author: 'Mozart' },
      { text: 'Concentrate all your thoughts upon the work in hand. The sun\'s rays do not burn until brought to a focus.', author: 'Alexander Graham Bell' },
      { text: 'Efficiency is doing things right; effectiveness is doing the right things.', author: 'Peter Drucker' },
      { text: 'The successful person makes a habit of doing what the failing person doesn\'t like to do.', author: 'Thomas Edison' },
      { text: 'Never mistake motion for action.', author: 'Ernest Hemingway' },
      { text: 'Either you run the day or the day runs you.', author: 'Jim Rohn' },
      { text: 'To think is easy. To act is hard. But the hardest thing in the world is to act in accordance with your thinking.', author: 'Johann Wolfgang von Goethe' },
      { text: 'The common man is not concerned about the passage of time, the man of talent is driven by it.', author: 'Schopenhauer' },
      { text: 'Do not wait; the time will never be just right. Start where you stand.', author: 'Napoleon Hill' },
      { text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
      { text: 'Time is what we want most, but what we use worst.', author: 'William Penn' },
      { text: 'Start by doing what\'s necessary; then do what\'s possible; and suddenly you are doing the impossible.', author: 'Francis of Assisi' },
      { text: 'Your mind is for having ideas, not holding them.', author: 'David Allen' },
      { text: 'The difference between try and triumph is just a little umph!', author: 'Marvin Phillips' },
      { text: 'Nothing is less productive than to make more efficient what should not be done at all.', author: 'Peter Drucker' },
      { text: 'Be like a postage stamp—stick to one thing until you get there.', author: 'Josh Billings' },
    ],
  },
  {
    name: 'Wisdom & Philosophy',
    description: 'Timeless wisdom and philosophical insights for deep thinking',
    quotes: [
      { text: 'The unexamined life is not worth living.', author: 'Socrates' },
      { text: 'Knowing yourself is the beginning of all wisdom.', author: 'Aristotle' },
      { text: 'The only true wisdom is in knowing you know nothing.', author: 'Socrates' },
      { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Aristotle' },
      { text: 'In the end, it\'s not the years in your life that count. It\'s the life in your years.', author: 'Abraham Lincoln' },
      { text: 'Life is what happens when you\'re busy making other plans.', author: 'John Lennon' },
      { text: 'The mind is everything. What you think you become.', author: 'Buddha' },
      { text: 'Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.', author: 'Buddha' },
      { text: 'The journey of a thousand miles begins with one step.', author: 'Lao Tzu' },
      { text: 'He who knows others is wise; he who knows himself is enlightened.', author: 'Lao Tzu' },
      { text: 'Nature does not hurry, yet everything is accomplished.', author: 'Lao Tzu' },
      { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
      { text: 'The man who moves a mountain begins by carrying away small stones.', author: 'Confucius' },
      { text: 'Our greatest glory is not in never falling, but in rising every time we fall.', author: 'Confucius' },
      { text: 'Wherever you go, go with all your heart.', author: 'Confucius' },
      { text: 'What we think, we become.', author: 'Buddha' },
      { text: 'Peace comes from within. Do not seek it without.', author: 'Buddha' },
      { text: 'The obstacle is the path.', author: 'Zen Proverb' },
      { text: 'Let go or be dragged.', author: 'Zen Proverb' },
      { text: 'The quieter you become, the more you can hear.', author: 'Ram Dass' },
      { text: 'Turn your wounds into wisdom.', author: 'Oprah Winfrey' },
      { text: 'You cannot find peace by avoiding life.', author: 'Virginia Woolf' },
      { text: 'Everything you can imagine is real.', author: 'Pablo Picasso' },
      { text: 'Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.', author: 'Rumi' },
      { text: 'The cave you fear to enter holds the treasure you seek.', author: 'Joseph Campbell' },
      { text: 'He who has a why to live can bear almost any how.', author: 'Friedrich Nietzsche' },
      { text: 'That which does not kill us makes us stronger.', author: 'Friedrich Nietzsche' },
      { text: 'To live is to suffer, to survive is to find some meaning in the suffering.', author: 'Friedrich Nietzsche' },
      { text: 'The privilege of a lifetime is to become who you truly are.', author: 'Carl Jung' },
      { text: 'The best way out is always through.', author: 'Robert Frost' },
    ],
  },
  {
    name: 'Perseverance & Resilience',
    description: 'Quotes about overcoming challenges and building resilience',
    quotes: [
      { text: 'Fall seven times, stand up eight.', author: 'Japanese Proverb' },
      { text: 'It\'s not whether you get knocked down, it\'s whether you get up.', author: 'Vince Lombardi' },
      { text: 'The greatest glory in living lies not in never falling, but in rising every time we fall.', author: 'Nelson Mandela' },
      { text: 'Courage is not having the strength to go on; it is going on when you don\'t have the strength.', author: 'Theodore Roosevelt' },
      { text: 'Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.', author: 'Thomas Edison' },
      { text: 'When you come to the end of your rope, tie a knot and hang on.', author: 'Franklin D. Roosevelt' },
      { text: 'The only way out is through.', author: 'Robert Frost' },
      { text: 'Strength doesn\'t come from what you can do. It comes from overcoming the things you once thought you couldn\'t.', author: 'Rikki Rogers' },
      { text: 'Perseverance is not a long race; it is many short races one after the other.', author: 'Walter Elliot' },
      { text: 'It is not the mountain we conquer but ourselves.', author: 'Sir Edmund Hillary' },
      { text: 'The gem cannot be polished without friction, nor man perfected without trials.', author: 'Chinese Proverb' },
      { text: 'A smooth sea never made a skilled sailor.', author: 'Franklin D. Roosevelt' },
      { text: 'Difficult roads often lead to beautiful destinations.', author: 'Zig Ziglar' },
      { text: 'When everything seems to be going against you, remember that the airplane takes off against the wind, not with it.', author: 'Henry Ford' },
      { text: 'The comeback is always stronger than the setback.', author: 'Anonymous' },
      { text: 'You may have to fight a battle more than once to win it.', author: 'Margaret Thatcher' },
      { text: 'Rock bottom became the solid foundation on which I rebuilt my life.', author: 'J.K. Rowling' },
      { text: 'The only thing standing between you and your goal is the story you keep telling yourself.', author: 'Jordan Belfort' },
      { text: 'Never give up on a dream just because of the time it will take to accomplish it.', author: 'Earl Nightingale' },
      { text: 'Character cannot be developed in ease and quiet. Only through experience of trial and suffering can the soul be strengthened.', author: 'Helen Keller' },
      { text: 'The difference between a stumbling block and a stepping stone is how high you raise your foot.', author: 'Benny Lewis' },
      { text: 'Success is stumbling from failure to failure with no loss of enthusiasm.', author: 'Winston Churchill' },
      { text: 'We must accept finite disappointment, but never lose infinite hope.', author: 'Martin Luther King Jr.' },
      { text: 'It always seems impossible until it\'s done.', author: 'Nelson Mandela' },
      { text: 'Many of life\'s failures are people who did not realize how close they were to success when they gave up.', author: 'Thomas Edison' },
      { text: 'The struggle you\'re in today is developing the strength you need for tomorrow.', author: 'Robert Tew' },
      { text: 'Hard times may have held you down, but they will not last forever.', author: 'Anonymous' },
      { text: 'If you\'re going through hell, keep going.', author: 'Winston Churchill' },
      { text: 'You are never too old to set another goal or to dream a new dream.', author: 'C.S. Lewis' },
      { text: 'Don\'t let what you cannot do interfere with what you can do.', author: 'John Wooden' },
    ],
  },
]

async function seedQuotes() {
  console.log('Starting to seed quote sets...')

  for (const setData of defaultQuoteSets) {
    console.log(`\nCreating quote set: ${setData.name}`)

    // Create the quote set
    const { data: quoteSet, error: setError } = await supabase
      .from('quote_sets')
      .insert({
        name: setData.name,
        description: setData.description,
        user_id: null, // null = system default
        is_default: 1,
      })
      .select()
      .single()

    if (setError) {
      console.error(`Error creating quote set ${setData.name}:`, setError)
      continue
    }

    console.log(`Created quote set: ${quoteSet.id}`)
    console.log(`Adding ${setData.quotes.length} quotes...`)

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

    console.log(`Successfully added ${setData.quotes.length} quotes to ${setData.name}`)
  }

  console.log('\n✅ Quote seeding complete!')
  console.log(`\nSummary:`)
  console.log(`- ${defaultQuoteSets.length} quote sets created`)
  console.log(`- ${defaultQuoteSets.reduce((acc, set) => acc + set.quotes.length, 0)} total quotes added`)
}

seedQuotes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
