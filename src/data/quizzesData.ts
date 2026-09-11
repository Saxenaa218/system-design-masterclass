import { QuizQuestion } from '../types';

export const QUIZZES: QuizQuestion[] = [
  {
    id: 'q1-1',
    chapterId: 1,
    question: 'Why is it critical to make web servers completely stateless when scaling from zero to millions of users?',
    options: [
      'Stateless servers consume zero memory and require no CPU.',
      'Stateless servers allow any server behind a load balancer to process any request without session affinity (sticky sessions).',
      'Stateless servers guarantee that database write locks are never needed.',
      'Stateless servers eliminate the need for an API gateway.'
    ],
    correctIndex: 1,
    explanation: 'When web servers are stateless, session data is externalized into an in-memory cache (like Redis). Any web server can service any incoming request, enabling seamless auto-scaling and zero-downtime rolling deploys.',
    difficulty: 'Easy'
  },
  {
    id: 'q1-2',
    chapterId: 1,
    question: 'In a Master-Slave (Primary-Replica) database setup, what is the primary purpose of Read Replicas?',
    options: [
      'To execute distributed two-phase commit write transactions.',
      'To offload read queries from the Master database, scaling overall read throughput.',
      'To act as a warm Redis cache layer.',
      'To automatically shard user data across different geographic regions.'
    ],
    correctIndex: 1,
    explanation: 'Since most web applications have high read-to-write ratios (e.g. 10:1 or 100:1), read replicas offload read queries from the single Master write database.',
    difficulty: 'Easy'
  },
  {
    id: 'q2-1',
    chapterId: 2,
    question: 'If an application has 100 Million Daily Active Users (DAU) and each user performs an average of 10 requests per day, what is the approximate Average QPS?',
    options: [
      '1,157 QPS',
      '10,000 QPS',
      '115,700 QPS',
      '1,000,000 QPS'
    ],
    correctIndex: 1,
    explanation: 'Total requests/day = 100M * 10 = 1 Billion requests/day. Using the rule of thumb (1 day ≈ 100,000 seconds): 1,000,000,000 / 100,000 = 10,000 QPS (Exact: 1B / 86,400 ≈ 11,574 QPS).',
    difficulty: 'Medium'
  },
  {
    id: 'q2-2',
    chapterId: 2,
    question: 'According to Jeff Dean\'s Latency Numbers, roughly how much faster is reading sequentially from Main Memory (RAM) compared to seeking on a standard Hard Disk (HDD)?',
    options: [
      'Approximately 2 times faster',
      'Approximately 10 times faster',
      'Approximately 10,000 to 100,000 times faster',
      'They operate at the same latency'
    ],
    correctIndex: 2,
    explanation: 'RAM reference takes ~100ns whereas a mechanical disk seek takes ~10,000,000ns (10ms) — a difference of 100,000x! This is why caching in RAM is essential.',
    difficulty: 'Medium'
  },
  {
    id: 'q4-1',
    chapterId: 4,
    question: 'What is the primary advantage of the Token Bucket algorithm over the Leaky Bucket algorithm for public REST APIs?',
    options: [
      'Token Bucket consumes zero memory.',
      'Token Bucket allows short, bursts of legitimate traffic as long as tokens remain, whereas Leaky Bucket strictly enforces a constant outbound rate.',
      'Token Bucket guarantees strict FIFO ordering of all requests.',
      'Token Bucket does not require timestamp tracking.'
    ],
    correctIndex: 1,
    explanation: 'Token Bucket allows traffic bursts up to the max bucket capacity, which aligns with normal user web browsing behavior. Leaky bucket smooths traffic into a rigid constant rate.',
    difficulty: 'Medium'
  },
  {
    id: 'q4-2',
    chapterId: 4,
    question: 'How do you prevent Time-of-Check to Time-of-Use (TOCTOU) race conditions when implementing a distributed rate limiter with Redis?',
    options: [
      'Use HTTP 302 redirects.',
      'Execute rate check and increment operations inside an atomic Redis Lua script.',
      'Increase the TTL of the Redis key.',
      'Use MySQL table locks on every request.'
    ],
    correctIndex: 1,
    explanation: 'Redis executes Lua scripts atomically in a single event loop iteration, guaranteeing no other concurrent request can interleave between checking the token limit and updating it.',
    difficulty: 'Hard'
  },
  {
    id: 'q5-1',
    chapterId: 5,
    question: 'When adding a new cache node to a Consistent Hashing ring with N nodes, what fraction of keys need to be rehashed on average?',
    options: [
      '100% of all keys',
      '(N - 1) / N of all keys',
      '1 / N of all keys',
      '0% of all keys'
    ],
    correctIndex: 2,
    explanation: 'In consistent hashing, adding a node only affects the partition slice between the new node and its predecessor. On average, only 1/N of keys are redistributed.',
    difficulty: 'Medium'
  },
  {
    id: 'q5-2',
    chapterId: 5,
    question: 'Why are Virtual Nodes (Vnodes) introduced into Consistent Hashing rings?',
    options: [
      'To prevent cryptographic collision in MD5.',
      'To ensure a uniform, balanced distribution of keys across physical nodes and handle heterogeneous server capacities.',
      'To compress the memory footprint of the ring.',
      'To encrypt cache keys on disk.'
    ],
    correctIndex: 1,
    explanation: 'Without virtual nodes, random placement of few nodes creates severe hotspot partitions. 100-300 virtual nodes per physical machine evenly distribute key ranges across the ring.',
    difficulty: 'Medium'
  },
  {
    id: 'q6-1',
    chapterId: 6,
    question: 'In a distributed Key-Value store with N=3 replicas, which configuration guarantees Strong Consistency (Quorum Consensus)?',
    options: [
      'W = 1, R = 1',
      'W = 1, R = 2',
      'W = 2, R = 2',
      'W = 1, R = 3'
    ],
    correctIndex: 2,
    explanation: 'Quorum consensus requires W + R > N. With N=3, setting W=2 and R=2 gives 2 + 2 = 4 > 3, ensuring that the read set and write set overlap on at least one up-to-date replica node.',
    difficulty: 'Medium'
  },
  {
    id: 'q7-1',
    chapterId: 7,
    question: 'In the Twitter Snowflake 64-bit ID layout, why are the 41 timestamp bits placed at the high-order bits directly after the sign bit?',
    options: [
      'To ensure IDs generated across workers are roughly sortable in chronological order by primary key B-Trees.',
      'To allow negative IDs.',
      'To prevent the server from running out of memory.',
      'To encrypt the worker ID.'
    ],
    correctIndex: 0,
    explanation: 'Placing timestamp bits in the most significant bit positions ensures newer IDs are numerically larger than older IDs, making them naturally time-sortable and append-friendly in database B-Trees.',
    difficulty: 'Easy'
  },
  {
    id: 'q8-1',
    chapterId: 8,
    question: 'Why is Base62 encoding ([0-9, a-z, A-Z]) preferred over Base64 for URL shortener aliases?',
    options: [
      'Base62 produces shorter strings than Base64.',
      'Base64 contains characters like "+" and "/" which have special meanings in HTTP URLs and require URL escaping.',
      'Base62 compresses data with gzip automatically.',
      'Base64 is limited to 1,000 URLs.'
    ],
    correctIndex: 1,
    explanation: 'Base64 includes `+` and `/`, which are reserved URL query/path delimiters. Base62 uses only alphanumeric characters, making every token 100% URL-safe without escaping.',
    difficulty: 'Easy'
  },
  {
    id: 'q11-1',
    chapterId: 11,
    question: 'In a News Feed architecture, why is a pure Fanout-on-Write (Push model) problematic for celebrity accounts with 50M+ followers?',
    options: [
      'Celebrities post too frequently.',
      'Writing a single post requires updating 50 million separate user feed caches in Redis, causing massive queue lag (hotkey write amplification).',
      'Followers cannot read celebrity posts from cache.',
      'Cassandra does not support celebrity users.'
    ],
    correctIndex: 1,
    explanation: 'Fanout-on-write multiplies one write by millions of followers. For celebrities, a hybrid approach pulls their posts at feed read time (Fanout-on-read).',
    difficulty: 'Medium'
  },
  {
    id: 'q13-1',
    chapterId: 13,
    question: 'What is the time complexity of looking up suggestions for a prefix of length "p" in an in-memory Trie where each node stores the top 5 precomputed queries?',
    options: [
      'O(N) where N is the total dictionary word count',
      'O(p) where p is the length of the search prefix string',
      'O(p * log N)',
      'O(N^2)'
    ],
    correctIndex: 1,
    explanation: 'Traversing the Trie takes p steps (one node per character in prefix). Because the top 5 suggestions are precomputed and cached inside each node, fetching the list is O(1), making total lookup O(p).',
    difficulty: 'Medium'
  },
  {
    id: 'q19-1',
    chapterId: 19,
    question: 'How does Apache Kafka achieve multi-gigabit throughput when serving messages to consumers from disk?',
    options: [
      'By holding all messages permanently in JVM heap memory.',
      'By utilizing the Linux OS PageCache and the Zero-Copy `sendfile()` system call to transfer bytes directly from disk cache to the network socket.',
      'By running SQLite instances inside each consumer.',
      'By encrypting messages with SHA-256.'
    ],
    correctIndex: 1,
    explanation: 'Zero-copy (`sendfile`) transfers bytes directly from OS PageCache to the Network Interface Card (NIC) without copying data into application memory, eliminating CPU context switches.',
    difficulty: 'Hard'
  },
  {
    id: 'q26-1',
    chapterId: 26,
    question: 'In financial payment systems, what is the fundamental invariant of Double-Entry Bookkeeping?',
    options: [
      'All transactions must complete in under 5 milliseconds.',
      'The sum of all debit entries and credit entries in any transaction must equal zero (Debits = Credits).',
      'Payments must always use MySQL rather than NoSQL.',
      'Customers must be charged twice to ensure payment verification.'
    ],
    correctIndex: 1,
    explanation: 'In double-entry bookkeeping, money cannot appear or disappear. Every movement of funds is recorded as a debit to one account and a credit to another, ensuring the ledger always balances to 0.',
    difficulty: 'Medium'
  },
  {
    id: 'q28-1',
    chapterId: 28,
    question: 'Why do ultra-low latency stock exchange matching engines run on a single CPU thread with a deterministic sequencer rather than multi-threaded worker pools?',
    options: [
      'Single threads run 100x faster than GPUs.',
      'Single-threaded execution with a deterministic sequencer eliminates thread lock contention, race conditions, and ensures 100% reproducible order matching.',
      'Stock exchanges only trade one stock at a time.',
      'Single threads use less electricity.'
    ],
    correctIndex: 1,
    explanation: 'In financial trading, locks and mutexes introduce unpredictable latency spikes (jitter). A single-threaded sequencer processes orders strictly in FIFO price-time priority with microsecond predictability.',
    difficulty: 'Hard'
  }
];
