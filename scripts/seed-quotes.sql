-- Seed default quote sets
-- This will insert all 6 default quote sets with their quotes

-- First, let's create the Study & Learning set
DO $$
DECLARE
  study_set_id uuid;
  motivation_set_id uuid;
  success_set_id uuid;
  productivity_set_id uuid;
  wisdom_set_id uuid;
  perseverance_set_id uuid;
BEGIN
  -- Insert Study & Learning set
  INSERT INTO quote_sets (name, description, user_id, is_default)
  VALUES ('Study & Learning', 'Motivational quotes focused on studying, education, and continuous learning', NULL, 1)
  RETURNING id INTO study_set_id;

  -- Insert quotes for Study & Learning
  INSERT INTO quotes (quote_set_id, text, author) VALUES
  (study_set_id, 'The expert in anything was once a beginner.', 'Helen Hayes'),
  (study_set_id, 'Success is the sum of small efforts repeated day in and day out.', 'Robert Collier'),
  (study_set_id, 'Education is the most powerful weapon which you can use to change the world.', 'Nelson Mandela'),
  (study_set_id, 'The beautiful thing about learning is that no one can take it away from you.', 'B.B. King'),
  (study_set_id, 'Learning is not attained by chance, it must be sought for with ardor and attended to with diligence.', 'Abigail Adams'),
  (study_set_id, 'The more that you read, the more things you will know. The more that you learn, the more places you''ll go.', 'Dr. Seuss'),
  (study_set_id, 'An investment in knowledge pays the best interest.', 'Benjamin Franklin'),
  (study_set_id, 'Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.', 'Richard Feynman'),
  (study_set_id, 'The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.', 'Brian Herbert'),
  (study_set_id, 'Live as if you were to die tomorrow. Learn as if you were to live forever.', 'Mahatma Gandhi'),
  (study_set_id, 'Tell me and I forget. Teach me and I remember. Involve me and I learn.', 'Benjamin Franklin'),
  (study_set_id, 'The only source of knowledge is experience.', 'Albert Einstein'),
  (study_set_id, 'Anyone who stops learning is old, whether at twenty or eighty.', 'Henry Ford'),
  (study_set_id, 'Learning never exhausts the mind.', 'Leonardo da Vinci'),
  (study_set_id, 'In learning you will teach, and in teaching you will learn.', 'Phil Collins'),
  (study_set_id, 'Education is not preparation for life; education is life itself.', 'John Dewey'),
  (study_set_id, 'The mind is not a vessel to be filled, but a fire to be kindled.', 'Plutarch'),
  (study_set_id, 'Intellectual growth should commence at birth and cease only at death.', 'Albert Einstein'),
  (study_set_id, 'Wisdom is not a product of schooling but of the lifelong attempt to acquire it.', 'Albert Einstein'),
  (study_set_id, 'You don''t understand anything until you learn it more than one way.', 'Marvin Minsky'),
  (study_set_id, 'Study without desire spoils the memory, and it retains nothing that it takes in.', 'Leonardo da Vinci'),
  (study_set_id, 'The roots of education are bitter, but the fruit is sweet.', 'Aristotle'),
  (study_set_id, 'Knowledge is power. Information is liberating.', 'Kofi Annan'),
  (study_set_id, 'The best time to plant a tree was 20 years ago. The second best time is now.', 'Chinese Proverb'),
  (study_set_id, 'It is impossible for a man to learn what he thinks he already knows.', 'Epictetus'),
  (study_set_id, 'The important thing is not to stop questioning. Curiosity has its own reason for existing.', 'Albert Einstein'),
  (study_set_id, 'A person who never made a mistake never tried anything new.', 'Albert Einstein'),
  (study_set_id, 'Discipline is the bridge between goals and accomplishment.', 'Jim Rohn'),
  (study_set_id, 'We learn from failure, not from success.', 'Bram Stoker'),
  (study_set_id, 'Don''t let what you cannot do interfere with what you can do.', 'John Wooden');

  -- Insert Motivation & Inspiration set
  INSERT INTO quote_sets (name, description, user_id, is_default)
  VALUES ('Motivation & Inspiration', 'Powerful quotes to inspire action and maintain motivation', NULL, 1)
  RETURNING id INTO motivation_set_id;

  -- Insert quotes for Motivation & Inspiration
  INSERT INTO quotes (quote_set_id, text, author) VALUES
  (motivation_set_id, 'The only way to do great work is to love what you do.', 'Steve Jobs'),
  (motivation_set_id, 'Believe you can and you''re halfway there.', 'Theodore Roosevelt'),
  (motivation_set_id, 'Don''t watch the clock; do what it does. Keep going.', 'Sam Levenson'),
  (motivation_set_id, 'The future belongs to those who believe in the beauty of their dreams.', 'Eleanor Roosevelt'),
  (motivation_set_id, 'It always seems impossible until it''s done.', 'Nelson Mandela'),
  (motivation_set_id, 'Start where you are. Use what you have. Do what you can.', 'Arthur Ashe'),
  (motivation_set_id, 'The only impossible journey is the one you never begin.', 'Tony Robbins'),
  (motivation_set_id, 'Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Winston Churchill'),
  (motivation_set_id, 'What you get by achieving your goals is not as important as what you become by achieving your goals.', 'Zig Ziglar'),
  (motivation_set_id, 'You are never too old to set another goal or to dream a new dream.', 'C.S. Lewis'),
  (motivation_set_id, 'The way to get started is to quit talking and begin doing.', 'Walt Disney'),
  (motivation_set_id, 'Your time is limited, don''t waste it living someone else''s life.', 'Steve Jobs'),
  (motivation_set_id, 'If life were predictable it would cease to be life, and be without flavor.', 'Eleanor Roosevelt'),
  (motivation_set_id, 'In the middle of difficulty lies opportunity.', 'Albert Einstein'),
  (motivation_set_id, 'The only limit to our realization of tomorrow will be our doubts of today.', 'Franklin D. Roosevelt'),
  (motivation_set_id, 'Do not wait to strike till the iron is hot; but make it hot by striking.', 'William Butler Yeats'),
  (motivation_set_id, 'Whether you think you can or you think you can''t, you''re right.', 'Henry Ford'),
  (motivation_set_id, 'The best revenge is massive success.', 'Frank Sinatra'),
  (motivation_set_id, 'I have not failed. I''ve just found 10,000 ways that won''t work.', 'Thomas Edison'),
  (motivation_set_id, 'A person who never made a mistake never tried anything new.', 'Albert Einstein'),
  (motivation_set_id, 'The person who says it cannot be done should not interrupt the person who is doing it.', 'Chinese Proverb'),
  (motivation_set_id, 'There are no limits to what you can accomplish, except the limits you place on your own thinking.', 'Brian Tracy'),
  (motivation_set_id, 'You miss 100% of the shots you don''t take.', 'Wayne Gretzky'),
  (motivation_set_id, 'Strive not to be a success, but rather to be of value.', 'Albert Einstein'),
  (motivation_set_id, 'I attribute my success to this: I never gave or took any excuse.', 'Florence Nightingale'),
  (motivation_set_id, 'The question isn''t who is going to let me; it''s who is going to stop me.', 'Ayn Rand'),
  (motivation_set_id, 'If you''re offered a seat on a rocket ship, don''t ask what seat! Just get on.', 'Sheryl Sandberg'),
  (motivation_set_id, 'It is during our darkest moments that we must focus to see the light.', 'Aristotle'),
  (motivation_set_id, 'The only person you are destined to become is the person you decide to be.', 'Ralph Waldo Emerson'),
  (motivation_set_id, 'You define your own life. Don''t let other people write your script.', 'Oprah Winfrey');

  RAISE NOTICE 'Successfully seeded % quote sets with quotes!', 2;
END $$;
