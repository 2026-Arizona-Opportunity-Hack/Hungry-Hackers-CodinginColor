import type { ChoiceQuestion, Course } from "../types";

/**
 * "Intro to Artificial Intelligence" — converted from CIC's slide deck
 * (Intro to CV / Teachable Machine). Each module follows the CIC template:
 * warm-up (pretest) -> learn (slides) -> check -> practice/code -> exit -> wrap-up (post-test).
 * The wrap-up repeats the warm-up questions so learning gain = post - pre.
 */

const m1Quiz: ChoiceQuestion[] = [
  {
    id: "m1q1",
    prompt: "Which best describes artificial intelligence?",
    choices: [
      "Any computer that is connected to the internet",
      "Computer systems that do tasks that usually need human intelligence",
      "A robot that looks and talks like a person",
      "A very fast calculator",
    ],
    answerIndex: 1,
    concept: "what-is-ai",
    hint: "Think about the kind of tasks AI takes on — what do they usually require from a person?",
    explanation:
      "AI means computer systems performing tasks that typically require human intelligence — like recognizing speech or making recommendations.",
  },
  {
    id: "m1q2",
    prompt: "Which of these is an example of AI you might use every day?",
    choices: [
      "A light switch",
      "A paper map",
      "TikTok or Netflix recommending what to watch next",
      "A calculator adding two numbers",
    ],
    answerIndex: 2,
    concept: "ai-in-daily-life",
    hint: "Which one learns from what you do and changes its answer for you?",
    explanation:
      "Recommendation systems (Google, Netflix, TikTok, Instagram) learn from your behavior — that's AI.",
  },
  {
    id: "m1q3",
    prompt: "Why is AI so much more popular now than 20 years ago?",
    choices: [
      "More data, better algorithms like deep learning, and faster computers",
      "Computers got smaller",
      "The internet was invented recently",
      "AI was illegal before",
    ],
    answerIndex: 0,
    concept: "what-is-ai",
    hint: "There were three big changes. What does an AI need to learn, and what does it need to run?",
    explanation:
      "Three things came together: much more data, advanced algorithms (deep learning) and big improvements in computing power.",
  },
];

const m2Quiz: ChoiceQuestion[] = [
  {
    id: "m2q1",
    prompt: "What are the three basic subfields of AI we covered?",
    choices: [
      "Hardware, software and the cloud",
      "Machine learning, natural language processing and computer vision",
      "Robots, drones and self-driving cars",
      "Python, Java and JavaScript",
    ],
    answerIndex: 1,
    concept: "subfields",
    hint: "One is about learning from data, one is about language, one is about seeing.",
    explanation:
      "Machine learning (learning from data), natural language processing (language) and computer vision (images and video).",
  },
  {
    id: "m2q2",
    prompt: "A phone app translates a sign from Spanish to English. Which subfield is that?",
    choices: ["Computer vision only", "Reinforcement learning", "Natural language processing", "Unsupervised learning"],
    answerIndex: 2,
    concept: "nlp",
    hint: "Translation is all about the interaction between computers and human ___.",
    explanation: "Translation is a classic natural language processing (NLP) task.",
  },
  {
    id: "m2q3",
    prompt: "Detecting a stop sign in a car's camera feed is an example of…",
    choices: ["Computer vision", "Natural language processing", "Speech recognition", "A spreadsheet formula"],
    answerIndex: 0,
    concept: "computer-vision",
    hint: "The input is an image or video. Which subfield understands visual information?",
    explanation: "Object detection in images and video is computer vision.",
  },
];

const m3Quiz: ChoiceQuestion[] = [
  {
    id: "m3q1",
    prompt: "An AI hiring tool rejects more applicants from one neighborhood. What's the best first question to ask?",
    choices: [
      "How can we make it faster?",
      "Is this serving everyone fairly — and who is accountable?",
      "Can we sell it to more companies?",
      "Nothing — computers can't be biased",
    ],
    answerIndex: 1,
    concept: "ethics",
    hint: "The deck says engineers should always ask one question about whether a system serves humankind.",
    explanation:
      "AI can repeat bias in its data. Engineers have a responsibility to ask whether a system is fair and who is accountable for harm.",
  },
  {
    id: "m3q2",
    prompt: "Which of these is one of UNESCO's four core values for AI?",
    choices: [
      "Maximum profit",
      "Ensuring diversity and inclusiveness",
      "Replacing human jobs as fast as possible",
      "Keeping all AI code secret",
    ],
    answerIndex: 1,
    concept: "ethics",
    hint: "The four values are about people, peaceful societies, inclusion and the planet.",
    explanation:
      "UNESCO's values: human rights and dignity; peaceful, just and interconnected societies; diversity and inclusiveness; a flourishing environment.",
  },
  {
    id: "m3q3",
    prompt: "Is AI always fair?",
    choices: [
      "Yes — math can't be unfair",
      "No — it can reflect bias in the data it learned from",
      "Only if it runs on a fast computer",
      "Only for computer vision",
    ],
    answerIndex: 1,
    concept: "ethics",
    hint: "Where does an AI learn its patterns from? Could that source have problems?",
    explanation: "AI learns from data made by people, so it can inherit people's biases.",
  },
];

const m4Quiz: ChoiceQuestion[] = [
  {
    id: "m4q1",
    prompt: "What is the FIRST step in building your own AI?",
    choices: ["Train the model", "Identify the problem", "Collect data", "Validate the model"],
    answerIndex: 1,
    concept: "ai-process",
    hint: "Before you gather anything, you need to know what you're solving.",
    explanation:
      "The 7 steps: identify the problem, collect data, select a model, prepare the data, train, validate, improve.",
  },
  {
    id: "m4q2",
    prompt: "Your pose model keeps confusing 'peace sign' with 'thumbs up'. What should you do?",
    choices: [
      "Delete the whole project",
      "Add more varied pictures to those classes and retrain",
      "Rename the classes",
      "Turn off the camera",
    ],
    answerIndex: 1,
    concept: "validation",
    hint: "During validation, a model gets better when you give it more of something.",
    explanation:
      "Keep adding diverse pictures to the class it gets wrong and retrain until results are good enough.",
  },
  {
    id: "m4q3",
    prompt: "Why use at least 15 pictures per pose, from different angles?",
    choices: [
      "So the dataset is diverse and representative",
      "Because the website requires exactly 15",
      "To make training slower",
      "It doesn't matter how many",
    ],
    answerIndex: 0,
    concept: "ai-process",
    hint: "Arms, body position and people all vary. What does the data need to cover?",
    explanation: "A diverse, representative dataset helps the model handle real-world variation.",
  },
];

export const introAiCourse: Course = {
  id: "intro-ai",
  title: "Intro to Artificial Intelligence",
  level: "Beginner · Grades 9–12",
  description:
    "What AI is, how it shows up in your life, the ethics behind it — then build your own computer vision model.",
  resources: [
    { label: "Microsoft — AI for Beginners", href: "https://microsoft.github.io/AI-For-Beginners/" },
    { label: "Google Cloud — Machine learning & AI training", href: "https://cloud.google.com/learn/training/machinelearning-ai" },
    { label: "Google Teachable Machine", href: "https://teachablemachine.withgoogle.com/" },
  ],
  modules: [
    {
      id: "m1",
      number: 1,
      title: "What is AI?",
      summary: "What AI is, why it matters, where you already use it, and why it's everywhere now.",
      activities: [
        { id: "m1-pre", kind: "pretest", title: "Warm-up: what do you already know?", minutes: 3, questions: m1Quiz },
        {
          id: "m1-learn",
          kind: "slides",
          title: "What is Artificial Intelligence?",
          minutes: 8,
          slides: [
            { title: "What is Artificial Intelligence?", bullets: [], divider: true },
            {
              title: "What is AI?",
              bullets: [
                "AI is computer systems performing tasks that typically require human intelligence.",
                "It can revolutionize industries, improve efficiency and enhance decision-making.",
              ],
            },
            {
              title: "Why is AI important?",
              bullets: [
                "Transformation of industries — like healthcare, where AI helps read medical scans.",
                "Efficiency and productivity — automating repetitive work.",
                "Enhanced decision-making — finding patterns people would miss.",
              ],
            },
            {
              title: "How do we use AI in our daily lives?",
              bullets: [
                "Voice assistants: Siri, Alexa, Google Assistant.",
                "Recommendation systems: Google, Netflix, TikTok, Instagram.",
                "Smart home devices: Google Home, Nest.",
              ],
            },
            {
              title: "Why is AI so popular now?",
              bullets: [
                "Increased data — we create more of it every day.",
                "Advanced algorithms — especially deep learning.",
                "Improvements in computing — faster chips make training possible.",
              ],
            },
          ],
        },
        {
          id: "m1-check",
          kind: "check",
          title: "Quick check",
          minutes: 2,
          questions: [m1Quiz[1]],
        },
        {
          id: "m1-practice",
          kind: "worksheet",
          title: "Worksheet: Spot the AI in your day",
          minutes: 8,
          intro: "Think about yesterday from the moment you woke up. Where did AI show up?",
          fields: [
            { id: "where", label: "Name one app or device you used that has AI in it.", kind: "short" },
            { id: "what", label: "What task was the AI doing for you?", kind: "long", help: "Example: guessing which video I'd like next." },
            { id: "human", label: "How would a person do that same task without AI?", kind: "long" },
          ],
        },
        {
          id: "m1-exit",
          kind: "exit",
          title: "Exit question",
          minutes: 2,
          prompt: "In your own words: what makes something 'artificial intelligence' instead of a regular program?",
          concept: "what-is-ai",
        },
        { id: "m1-post", kind: "posttest", title: "Wrap-up quiz", minutes: 3, questions: m1Quiz },
      ],
    },
    {
      id: "m2",
      number: 2,
      title: "Subfields of AI",
      summary: "Machine learning, natural language processing and computer vision — and your first Python 'AI'.",
      activities: [
        { id: "m2-pre", kind: "pretest", title: "Warm-up", minutes: 3, questions: m2Quiz },
        {
          id: "m2-learn",
          kind: "slides",
          title: "The basic subfields of AI",
          minutes: 8,
          slides: [
            {
              title: "High-level overview: the basic subfields of AI",
              bullets: [
                "Machine learning (ML): supervised, unsupervised and reinforcement learning.",
                "Natural language processing (NLP): speech recognition, chatbots.",
                "Computer vision (CV): object detection and classification — hint, hint!",
              ],
            },
            {
              title: "AI concepts: Machine Learning",
              bullets: [
                "Algorithms and models that let computers learn from data.",
                "Supervised: learn from labeled examples.",
                "Unsupervised: find patterns with no labels.",
                "Reinforcement: learn by trial, error and reward.",
              ],
            },
            {
              title: "AI concepts: Natural Language Processing",
              bullets: [
                "How computers interact with human language.",
                "Translation, sentiment analysis, speech recognition, question answering, text generation.",
              ],
            },
            {
              title: "AI concepts: Computer Vision",
              bullets: [
                "Understanding visual information from images and videos.",
                "Object detection, image classification, image segmentation, facial recognition.",
              ],
            },
          ],
        },
        { id: "m2-check", kind: "check", title: "Quick check", minutes: 2, questions: [m2Quiz[1]] },
        {
          id: "m2-code",
          kind: "code",
          title: "Code: a rule-based mood detector",
          minutes: 12,
          concept: "nlp",
          instructions: [
            "Sentiment analysis is an NLP task: deciding if text sounds happy or sad.",
            "Before machine learning, programmers wrote rules by hand. Let's try it!",
            "Finish the function mood(text) so it returns \"happy\" if the text contains \"love\" or \"great\", \"sad\" if it contains \"hate\" or \"bad\", and \"neutral\" otherwise.",
            "Click Run code to try it, then Check my code to run the tests.",
          ],
          starter:
            'def mood(text):\n    text = text.lower()\n    # TODO: return "happy", "sad" or "neutral"\n    return "neutral"\n\n\nprint(mood("I love this song"))\nprint(mood("That movie was bad"))\nprint(mood("It is Tuesday"))\n',
          exampleOutput: "happy\nsad\nneutral",
          tests: [
            { expr: 'mood("I love pizza")', expected: '"happy"', description: '"I love pizza" is happy' },
            { expr: 'mood("This is GREAT")', expected: '"happy"', description: "Works with capital letters" },
            { expr: 'mood("I hate rain")', expected: '"sad"', description: '"I hate rain" is sad' },
            { expr: 'mood("The bus is late")', expected: '"neutral"', description: "No mood words means neutral" },
          ],
          hints: [
            "Python can check if one string is inside another with the keyword in — like \"love\" in text.",
            "Use if / elif / else. Check the happy words first, then the sad words, then fall through to neutral.",
            "Combine two checks with or: if \"love\" in text or \"great\" in text:",
          ],
        },
        {
          id: "m2-exit",
          kind: "exit",
          title: "Exit question",
          minutes: 2,
          prompt: "Your mood detector used hand-written rules. What's one sentence it would get wrong — and how could machine learning do better?",
          concept: "machine-learning",
        },
        { id: "m2-post", kind: "posttest", title: "Wrap-up quiz", minutes: 3, questions: m2Quiz },
      ],
    },
    {
      id: "m3",
      number: 3,
      title: "Our Ethical Responsibility",
      summary: "Can we build whatever we want with AI? Well yes, but no. Fairness, accountability and UNESCO's values.",
      activities: [
        { id: "m3-pre", kind: "pretest", title: "Warm-up", minutes: 3, questions: m3Quiz },
        {
          id: "m3-learn",
          kind: "slides",
          title: "So can we just build whatever we want?",
          minutes: 8,
          slides: [
            { title: "So can we just build whatever we want with AI?", bullets: ["Well yes, but no… we have a responsibility to one another as humans."], divider: true },
            {
              title: "What is our ethical responsibility?",
              bullets: [
                "Engineers who build AI hold great responsibility.",
                "Analyze every system through an ethical lens.",
                "Always ask: is this serving humankind?",
                "Groups that work on this: AlgorithmWatch, AI Now Institute, CHAI.",
              ],
            },
            {
              title: "UNESCO's four core values",
              bullets: [
                "1. Human rights and human dignity.",
                "2. Living in peaceful, just and interconnected societies.",
                "3. Ensuring diversity and inclusiveness.",
                "4. Environment and ecosystem flourishing.",
              ],
            },
          ],
        },
        { id: "m3-check", kind: "check", title: "Quick check", minutes: 2, questions: [m3Quiz[1]] },
        {
          id: "m3-practice",
          kind: "worksheet",
          title: "Worksheet: Group reflection",
          minutes: 10,
          intro: "Discuss with a partner or think on your own, then write your answers.",
          fields: [
            { id: "fair", label: "Is AI always fair? Why or why not?", kind: "long" },
            { id: "accountable", label: "Who should be accountable when AI makes a harmful or biased decision?", kind: "long" },
            { id: "artists", label: "Is it fair to use artists' work to train AI?", kind: "long" },
            { id: "jobs", label: "AI and automation change jobs. What's one way to make that transition fair?", kind: "long" },
          ],
        },
        {
          id: "m3-exit",
          kind: "exit",
          title: "Exit question",
          minutes: 2,
          prompt: "What is one value of our ethical responsibility when building AI?",
          concept: "ethics",
        },
        { id: "m3-post", kind: "posttest", title: "Wrap-up quiz", minutes: 3, questions: m3Quiz },
      ],
    },
    {
      id: "m4",
      number: 4,
      title: "Build Your Own AI",
      summary: "The 7-step process, then train a pose classifier in Teachable Machine and measure its accuracy in Python.",
      activities: [
        { id: "m4-pre", kind: "pretest", title: "Warm-up", minutes: 3, questions: m4Quiz },
        {
          id: "m4-learn",
          kind: "slides",
          title: "What if I want to build my own AI?",
          minutes: 10,
          slides: [
            {
              title: "What if I want to build my own AI?",
              bullets: [
                "1. Identify the problem",
                "2. Collect data",
                "3. Select an AI model",
                "4. Prepare the data",
                "5. Train the model",
                "6. Validate the model",
                "7. Improvements",
              ],
            },
            {
              title: "Project 1: Pose classifier",
              bullets: [
                "Problem: computers have difficulty detecting poses and gestures.",
                "Objective: create a model that, given pictures of 3 different poses, correctly classifies each pose.",
              ],
            },
            {
              title: "1) Identify the problem",
              bullets: ["Poses vary: arm location, body position and different people all change the picture."],
              ourProject: "Go to Teachable Machine → Image Project → Pose Model.",
            },
            {
              title: "2) Collect data",
              bullets: [
                "Collect a diverse, representative dataset.",
                "Clean it: remove duplicates, handle missing values, fix inconsistencies.",
              ],
              ourProject: "3 poses — peace sign, thumbs up, forks up — with at least 15 pictures each.",
            },
            {
              title: "5) Train the model",
              bullets: [
                "Feed training data through the model.",
                "Compare its output to the true labels and measure the error (the loss).",
              ],
              ourProject: "Keep the preset settings, select Train, and wait a few minutes. Ta-da!",
            },
            {
              title: "6) Validate the model",
              bullets: ["Test it on examples it hasn't seen.", "Keep adding pictures and retraining until results are good enough."],
              ourProject: "Pose in front of the camera. If a pose is misidentified, add more pictures to that class.",
            },
          ],
        },
        { id: "m4-check", kind: "check", title: "Quick check", minutes: 2, questions: [m4Quiz[0]] },
        {
          id: "m4-practice",
          kind: "worksheet",
          title: "Lab: Train a pose classifier",
          minutes: 20,
          intro:
            "Open Teachable Machine in a new tab, follow the 7 steps, then record what happened. Tip: in settings, turn off 'Hold to Record' and record for 6 seconds.",
          link: { href: "https://teachablemachine.withgoogle.com/train/pose", label: "Open Teachable Machine (new tab)" },
          fields: [
            { id: "classes", label: "What are your 3 pose classes called?", kind: "short" },
            { id: "pictures", label: "How many pictures did you take for each class?", kind: "number" },
            { id: "confused", label: "Which pose did the model confuse most often? What did you do about it?", kind: "long" },
          ],
        },
        {
          id: "m4-code",
          kind: "code",
          title: "Code: how accurate is your model?",
          minutes: 12,
          concept: "validation",
          instructions: [
            "When you validate a model, you compare its predictions to the true answers.",
            "Finish accuracy(predictions, answers) so it returns the fraction of predictions that match, from 0.0 to 1.0.",
            "Use a loop, count the matches, and divide by how many there are.",
          ],
          starter:
            'def accuracy(predictions, answers):\n    correct = 0\n    # TODO: count how many predictions match the answers\n    return correct / len(answers)\n\n\npreds = ["peace", "thumbs", "forks", "peace"]\ntruth = ["peace", "thumbs", "peace", "peace"]\nprint(accuracy(preds, truth))\n',
          exampleOutput: "0.75",
          tests: [
            { expr: 'accuracy(["a","b","c","a"], ["a","b","a","a"])', expected: "0.75", description: "3 of 4 correct is 0.75" },
            { expr: 'accuracy(["x","y"], ["x","y"])', expected: "1.0", description: "All correct is 1.0" },
            { expr: 'accuracy(["x","y"], ["y","x"])', expected: "0.0", description: "None correct is 0.0" },
          ],
          hints: [
            "You can walk through two lists at the same time with for p, a in zip(predictions, answers):",
            "Inside the loop, if p == a, add 1 to correct.",
            "Keep the return line as it is — it already divides by the number of answers.",
          ],
        },
        {
          id: "m4-exit",
          kind: "exit",
          title: "Pop quiz",
          minutes: 3,
          prompt: "What did you build today, and what are the 3 basic subfields of AI?",
          concept: "ai-process",
        },
        { id: "m4-post", kind: "posttest", title: "Wrap-up quiz", minutes: 3, questions: m4Quiz },
      ],
    },
  ],
};
