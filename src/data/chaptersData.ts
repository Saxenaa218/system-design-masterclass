import { Chapter } from '../types';

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    slug: 'scaling-from-zero-to-millions',
    number: '01',
    title: 'Scale From Zero To Millions Of Users',
    category: 'Foundations',
    difficulty: 'Beginner',
    readTimeMin: 12,
    summary: 'The evolutionary journey of an application: single server setup, database replication, caching, CDN, stateless web tiers, multi-data centers, message queues, and database sharding.',
    problemStatement: 'How do you evolve a system starting with a single user on a single server to handling 10+ million concurrent global users with high availability, low latency, and fault tolerance?',
    keyRequirements: {
      functional: ['Support user traffic scaling from 1 to 10M+ users', 'Performant read and write queries', 'Instant static asset delivery'],
      nonFunctional: ['99.99% Availability', 'P99 Latency < 100ms', 'Zero single points of failure (SPOF)', 'Horizontally scalable architecture']
    },
    intuition: {
      analogy: 'Imagine a single chef operating a food truck (single server). As thousands of customers arrive, you hire more chefs (horizontal scaling), introduce a menu order board (load balancer), prep common ingredients ahead of time (cache/CDN), and split kitchens by cuisine (database sharding).',
      whyNaiveFails: 'Vertical scaling (bigger RAM/CPU) hits a hard hardware ceiling and creates a catastrophic Single Point of Failure (SPOF). When the machine crashes or reaches max I/O, the entire app goes down.',
      coreInsight: 'Decouple state from compute. Make web servers completely stateless so they can scale to infinity behind a Load Balancer, while moving persistence to clustered, replicated, and sharded data layers with multi-tier caching.'
    },
    architectureNodes: [
      { id: 'user', label: 'Global Users / App', type: 'client', description: 'Web/Mobile clients initiating HTTP/2 & DNS queries', x: 50, y: 150 },
      { id: 'dns', label: 'Geo DNS & CDN', type: 'cdn', description: 'Cloudflare / AWS CloudFront caching static images/JS at the edge', x: 220, y: 80 },
      { id: 'lb', label: 'Layer 7 Load Balancer', type: 'gateway', description: 'NGINX / AWS ALB health checks & SSL termination', x: 220, y: 220 },
      { id: 'web1', label: 'Web Tier (Node 1)', type: 'service', description: 'Stateless Node.js/Go web worker', x: 420, y: 140 },
      { id: 'web2', label: 'Web Tier (Node 2)', type: 'service', description: 'Stateless Node.js/Go web worker', x: 420, y: 240 },
      { id: 'cache', label: 'Redis Cluster (Cache)', type: 'cache', description: 'In-memory key-value caching hot read queries & sessions', x: 620, y: 100 },
      { id: 'mq', label: 'Kafka / RabbitMQ', type: 'queue', description: 'Decoupled asynchronous event buffer for background tasks', x: 620, y: 220 },
      { id: 'db_master', label: 'DB Master (Writes)', type: 'database', description: 'Relational DB handling INSERT, UPDATE, DELETE', x: 800, y: 80 },
      { id: 'db_slave', label: 'DB Read Replicas', type: 'database', description: 'Read-only replicas syncing via binary replication logs', x: 800, y: 200 },
      { id: 'worker', label: 'Async Workers', type: 'worker', description: 'Image processing, email triggers, analytics consumers', x: 800, y: 310 },
    ],
    architectureEdges: [
      { from: 'user', to: 'dns', label: 'Static Assets (Edge)', protocol: 'HTTP/2', animated: true },
      { from: 'user', to: 'lb', label: 'Dynamic API Requests', protocol: 'HTTP/2', animated: true },
      { from: 'lb', to: 'web1', label: 'Round Robin', protocol: 'HTTP/2' },
      { from: 'lb', to: 'web2', label: 'Least Connections', protocol: 'HTTP/2' },
      { from: 'web1', to: 'cache', label: 'Cache-Aside (Read)', protocol: 'Redis Protocol' },
      { from: 'web2', to: 'cache', label: 'Cache-Aside (Read)', protocol: 'Redis Protocol' },
      { from: 'web1', to: 'mq', label: 'Publish Job', protocol: 'Kafka' },
      { from: 'web1', to: 'db_master', label: 'Write Transaction', protocol: 'SQL' },
      { from: 'web2', to: 'db_slave', label: 'Read Query', protocol: 'SQL' },
      { from: 'db_master', to: 'db_slave', label: 'Replication Stream', protocol: 'TCP' },
      { from: 'mq', to: 'worker', label: 'Consume Task', protocol: 'Kafka' },
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Edge Caching & DNS Lookup',
        description: 'User enters URL. Geo-DNS resolves IP to closest data center. Static assets (CSS, images, videos) are served immediately from CDN edge with sub-20ms latency.',
        activeNodeIds: ['user', 'dns'],
        highlightTip: 'CDN hit ratio should be > 90% for media assets, saving backend bandwidth.'
      },
      {
        stepNumber: 2,
        title: 'Load Balancing & SSL Termination',
        description: 'Dynamic API requests hit Layer 7 Load Balancer. It terminates TLS/SSL and distributes requests across stateless web nodes.',
        activeNodeIds: ['lb', 'web1', 'web2'],
        highlightTip: 'Stateless servers mean any server can handle any user session (store sessions in Redis, not RAM).'
      },
      {
        stepNumber: 3,
        title: 'Cache-Aside Read Path',
        description: 'Web server checks Redis for cached query. If cache hit, returns data in < 2ms. If cache miss, reads from DB Read Replica and writes back to Redis.',
        activeNodeIds: ['web1', 'cache', 'db_slave'],
        highlightTip: 'Cache-aside prevents database overload. Use TTL to avoid stale data accumulation.'
      },
      {
        stepNumber: 4,
        title: 'Write Path & Async Decoupling',
        description: 'Write operations (create post, place order) commit to DB Master. Heavy tasks (notifications, transcode) publish to Kafka for background workers.',
        activeNodeIds: ['web1', 'db_master', 'mq', 'worker'],
        highlightTip: 'Master asynchronously replicates binlog to Read Replicas.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Stateless Architecture & Distributed Sessions',
        content: 'In early architectures, user sessions were stored in server memory (sticky sessions). This creates severe scaling bottlenecks and breaks if a server dies. Modern systems externalize session state into Redis or JWT tokens, allowing any web instance to service any request.',
        codeSnippet: {
          language: 'typescript',
          code: `// Express/Redis Stateless Session Pattern
import express from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient({ url: 'redis://redis-cluster:6379' });
await redisClient.connect();

const app = express();
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, httpOnly: true, maxAge: 86400000 }
}));`
        }
      },
      {
        title: 'Database Sharding Strategies',
        content: 'When a single database master exhausts vertical write IOPS, we shard data horizontally across multiple physical database instances. Common sharding keys include user_id (hash-based sharding). Watch out for celebrity hotspots and cross-shard join queries.',
        callout: {
          type: 'warning',
          text: 'Cross-shard joins are notoriously slow. Denormalize data or handle joins in the application tier when sharding is introduced.'
        }
      }
    ],
    tradeoffs: [
      {
        approachA: 'Vertical Scaling (Scale Up)',
        approachB: 'Horizontal Scaling (Scale Out)',
        verdict: 'Scale out is essential for high availability and hyper-scale beyond hardware limits.',
        prosA: ['Simple setup', 'No distributed transaction headaches', 'Zero network latency between cores'],
        prosB: ['Infinite scaling potential', 'High availability (failover)', 'Cost efficient commodity hardware'],
        whenToUse: 'Scale up for early prototypes; scale out once traffic exceeds single-box capacity.'
      }
    ],
    keyTakeaways: [
      { title: 'Stateless Web Tier', description: 'Never store user sessions on local web server disks or memory.' },
      { title: 'Multi-Tier Caching', description: 'Cache at browser, CDN edge, API gateway, and Redis layer to shield DB.' },
      { title: 'Decouple with Message Queues', description: 'Make expensive operations asynchronous with Kafka or SQS.' }
    ],
    hasInteractiveLab: true,
    labType: 'scaling'
  },
  {
    id: 2,
    slug: 'back-of-the-envelope-estimation',
    number: '02',
    title: 'Back-of-the-Envelope Estimation',
    category: 'Foundations',
    difficulty: 'Beginner',
    readTimeMin: 10,
    summary: 'Master the powers of two, critical latency numbers every programmer should know, and calculate QPS, Peak QPS, storage, and network bandwidth in real time.',
    problemStatement: 'How do you accurately estimate the scale, compute capacity, RAM, storage, and network bandwidth required for a system design interview in under 5 minutes?',
    keyRequirements: {
      functional: ['Compute QPS & Peak QPS', 'Estimate 5-year persistent storage requirements', 'Calculate network egress/ingress bandwidth', 'Size memory cache using the 80/20 Pareto rule'],
      nonFunctional: ['Accuracy within realistic order of magnitude', 'Fast mental arithmetic (Powers of 2 and 10)']
    },
    intuition: {
      analogy: 'Like an architect calculating the concrete volume and steel tonnage needed for a skyscraper before sketching blueprints, back-of-the-envelope estimations prove your system will not collapse under data weight.',
      whyNaiveFails: 'Designing a system without estimating scale leads to severe over-engineering (e.g., building Kafka + Cassandra for 10 requests/day) or under-engineering (e.g., using MySQL for 500k writes/sec).',
      coreInsight: 'Convert daily active metrics into per-second rates (1 day = 86,400 ≈ 100,000 seconds for rapid estimation). Use powers of two for byte sizing.'
    },
    architectureNodes: [
      { id: 'dau', label: '300M Daily Active Users', type: 'client', description: 'Input DAU metric given by interviewer', x: 60, y: 150 },
      { id: 'qps_calc', label: 'QPS Sizer', type: 'service', description: '300M * 20 actions / 100k sec = 60,000 QPS (Peak 120k QPS)', x: 280, y: 150 },
      { id: 'storage_calc', label: 'Storage Sizer', type: 'database', description: '60M writes/day * 500B * 365 * 5 yrs ≈ 55 TB', x: 520, y: 100 },
      { id: 'ram_calc', label: '80/20 RAM Cache Sizer', type: 'cache', description: '20% hot daily read volume = 2.4 TB RAM across Redis cluster', x: 520, y: 220 },
      { id: 'bandwidth_calc', label: 'Bandwidth Sizer', type: 'gateway', description: '60k QPS * 2 KB payload ≈ 120 MB/s (0.96 Gbps)', x: 760, y: 150 }
    ],
    architectureEdges: [
      { from: 'dau', to: 'qps_calc', label: 'Daily actions', animated: true },
      { from: 'qps_calc', to: 'storage_calc', label: 'Write QPS' },
      { from: 'qps_calc', to: 'ram_calc', label: 'Read QPS' },
      { from: 'qps_calc', to: 'bandwidth_calc', label: 'Payload size' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Establish DAU & Action Frequency',
        description: 'Assume 300 Million DAU. Each user performs 20 reads and 2 writes per day.',
        activeNodeIds: ['dau', 'qps_calc'],
        highlightTip: 'Rule of thumb: 1 day ≈ 100,000 seconds (86,400 sec actual).'
      },
      {
        stepNumber: 2,
        title: 'Calculate Read & Write QPS',
        description: 'Read QPS: (300M * 20) / 100k = 60,000 QPS. Peak QPS = 2x Average = 120,000 QPS.',
        activeNodeIds: ['qps_calc'],
        highlightTip: 'Peak multiplier usually ranges between 2x to 5x depending on flash sales or events.'
      },
      {
        stepNumber: 3,
        title: 'Calculate 5-Year Storage Capacity',
        description: 'Write volume: 300M * 2 writes = 600M posts/day. At 500 Bytes each = 300 GB/day = 110 TB / year. 5-year storage with 3x replication ≈ 1.65 PB.',
        activeNodeIds: ['storage_calc'],
        highlightTip: 'Always factor in 3x replication factor for cloud data durability.'
      },
      {
        stepNumber: 4,
        title: 'Memory Cache Sizing (80/20 Rule)',
        description: '20% of content generates 80% of read traffic. Cache 20% of daily reads in RAM: 0.2 * 300 GB/day = 60 GB RAM.',
        activeNodeIds: ['ram_calc'],
        highlightTip: 'Modern Redis node has 64-128GB RAM; 60GB fits in a small 2-node cluster.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Latency Numbers Every Programmer Must Know (Jeff Dean)',
        content: '• L1 cache reference: 0.5 ns\n• Branch mispredict: 5 ns\n• L2 cache reference: 7 ns\n• Mutex lock/unlock: 25 ns\n• Main memory reference (RAM): 100 ns\n• Compress 1KB with Zippy: 3,000 ns (3 µs)\n• Send 1KB over 1 Gbps network: 10,000 ns (10 µs)\n• Read 1MB sequentially from memory: 250,000 ns (250 µs)\n• Round trip within same datacenter: 500,000 ns (0.5 ms)\n• Read 1MB sequentially from SSD: 1,000,000 ns (1 ms)\n• Disk seek (HDD): 10,000,000 ns (10 ms)\n• Read 1MB sequentially from HDD: 20,000,000 ns (20 ms)\n• Send packet CA to Netherlands & back: 150,000,000 ns (150 ms)',
        callout: {
          type: 'important',
          text: 'Memory access is ~10,000x faster than disk seeks! Avoid disk I/O on the hot read path.'
        }
      }
    ],
    tradeoffs: [
      {
        approachA: 'Rough Approximation (100k sec/day)',
        approachB: 'Exact Calculation (86,400 sec/day)',
        verdict: 'Interviewers look for problem-solving speed and order of magnitude, not digit precision.',
        prosA: ['Mental math in 10 seconds', 'Saves precious interview time'],
        prosB: ['Mathematically precise'],
        whenToUse: 'Use 100k approximation in 45-minute interviews.'
      }
    ],
    keyTakeaways: [
      { title: '1 Day ≈ 100k Seconds', description: 'Divide daily numbers by 100,000 for instant QPS estimation.' },
      { title: '80/20 Pareto Rule', description: 'Size memory cache to hold 20% of daily read data.' },
      { title: 'Always Multiply for Peak & Replication', description: 'Multiply write storage by 3x for replication and peak QPS by 2x-5x.' }
    ],
    hasInteractiveLab: true,
    labType: 'estimator'
  },
  {
    id: 3,
    slug: 'system-design-framework',
    number: '03',
    title: 'A Framework For System Design Interviews',
    category: 'Foundations',
    difficulty: 'Beginner',
    readTimeMin: 11,
    summary: 'The battle-tested 4-step framework for acing any 45-minute system design interview without getting lost or running out of time.',
    problemStatement: 'How do you structure an open-ended 45-minute system design discussion into a clear, methodical engineering blueprint?',
    keyRequirements: {
      functional: ['Understand scope & requirements', 'Propose high-level design', 'Conduct architecture deep dives', 'Wrap up with bottlenecks & operational excellence'],
      nonFunctional: ['Manage time across 4 phases', 'Drive collaborative dialogue', 'Defend trade-offs with concrete reasoning']
    },
    intuition: {
      analogy: 'A system design interview is like pitching an architectural blueprint to a CTO. You do not start by picking the bathroom tile color (database indexes); you first agree on building dimensions, occupancy, and structural foundation.',
      whyNaiveFails: 'Jumping straight into microservices, Kafka, or specific databases without clarifying constraints and requirements is the #1 reason candidates fail.',
      coreInsight: 'Lead the conversation. System design is not an exam with one right answer—it is an evaluation of how you handle ambiguity, communicate trade-offs, and design for real-world constraints.'
    },
    architectureNodes: [
      { id: 'step1', label: 'Step 1: Clarify Scope (3-5 min)', type: 'client', description: 'Ask clarifying questions, define functional/non-functional requirements & scale', x: 60, y: 150 },
      { id: 'step2', label: 'Step 2: High-Level Design (10-15 min)', type: 'gateway', description: 'Draw end-to-end components, API signatures & database schemas', x: 300, y: 150 },
      { id: 'step3', label: 'Step 3: Design Deep Dive (15-20 min)', type: 'service', description: 'Drill into top 2-3 technical bottlenecks, algorithms, and data structures', x: 540, y: 150 },
      { id: 'step4', label: 'Step 4: Wrap-Up & Failures (3-5 min)', type: 'database', description: 'Review failure modes, monitoring, SLIs/SLOs, and future scale bottlenecks', x: 780, y: 150 }
    ],
    architectureEdges: [
      { from: 'step1', to: 'step2', label: 'Agreed Scope', animated: true },
      { from: 'step2', to: 'step3', label: 'Architecture Skeleton', animated: true },
      { from: 'step3', to: 'step4', label: 'Optimized Blueprint', animated: true }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Step 1: Understand Problem & Scope',
        description: 'Ask: What specific features? What scale (DAU)? What are the latency and availability targets? What mobile/web platforms?',
        activeNodeIds: ['step1'],
        highlightTip: 'Never assume. Confirm whether consistency or availability is prioritized (CAP theorem).'
      },
      {
        stepNumber: 2,
        title: 'Step 2: Propose High-Level Blueprint',
        description: 'Sketch the major building blocks: Client -> API Gateway -> App Server -> Storage / Cache. Define 2-3 core REST/gRPC endpoints.',
        activeNodeIds: ['step2'],
        highlightTip: 'Get interviewer buy-in before deep-diving into specific components.'
      },
      {
        stepNumber: 3,
        title: 'Step 3: Technical Deep Dive',
        description: 'Focus on the hard parts: Concurrency control, rate limiting, distributed caching, partition strategies, consensus mechanisms.',
        activeNodeIds: ['step3'],
        highlightTip: 'Show depth on 2 key components rather than superficial breadth on 10.'
      },
      {
        stepNumber: 4,
        title: 'Step 4: Wrap Up & Failure Scenarios',
        description: 'Discuss: What happens if Redis dies? How do we handle hot partitions? What telemetry/metrics do we emit?',
        activeNodeIds: ['step4'],
        highlightTip: 'Summarize the architecture in 60 seconds highlighting the primary trade-offs made.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'The 45-Minute Time Allocation Template',
        content: '• 00:00 - 05:00 (5 min): Understand scope, requirements, back-of-envelope numbers\n• 05:00 - 15:00 (10 min): High-level diagram, API schemas, data models\n• 15:00 - 35:00 (20 min): Detailed deep dives into challenging bottlenecks\n• 35:00 - 45:00 (10 min): Failure analysis, metrics, Q&A'
      }
    ],
    tradeoffs: [
      {
        approachA: 'Interviewee Dictates Without Asking',
        approachB: 'Interactive Collaborative Dialogue',
        verdict: 'Treat the interviewer as a senior colleague collaborating on design.',
        prosA: ['Covers planned topics'],
        prosB: ['Shows teamwork', 'Catches misunderstandings early', 'Steers toward interviewer interests'],
        whenToUse: 'Always maintain continuous dialogue.'
      }
    ],
    keyTakeaways: [
      { title: '4-Step Discipline', description: 'Clarify -> High-Level -> Deep-Dive -> Wrap Up.' },
      { title: 'Clarify Scale First', description: 'Storage and concurrency constraints dictate your database choice.' }
    ],
    hasInteractiveLab: true,
    labType: 'framework'
  },
  {
    id: 4,
    slug: 'rate-limiter',
    number: '04',
    title: 'Design A Rate Limiter',
    category: 'Core Distributed Systems',
    difficulty: 'Intermediate',
    readTimeMin: 14,
    summary: 'Prevent DoS attacks, brute force, and API starvation by designing a distributed rate limiter. Compares Token Bucket, Leaky Bucket, Fixed Window, Sliding Window Log, and Sliding Window Counter.',
    problemStatement: 'Design a distributed rate limiter capable of throttling millions of requests per second with microsecond latency, multi-node synchronization, and race-condition immunity.',
    keyRequirements: {
      functional: ['Throttle requests exceeding client/IP thresholds', 'Return HTTP 429 Too Many Requests with Retry-After header', 'Support configurable rules (per user, per IP, per endpoint)'],
      nonFunctional: ['Ultra-low latency (< 1ms overhead)', 'Distributed synchronization across multiple gateway instances', 'Fault tolerance (fail-open or fail-close)']
    },
    intuition: {
      analogy: 'A nightclub bouncer (rate limiter) with a stamp card. You get 5 free entries per hour. Once your card is stamped 5 times, you must wait outside until the hour resets.',
      whyNaiveFails: 'Tracking counters in application server memory fails because requests arrive across a farm of 50 load-balanced servers. A simple Redis `GET + INCR` creates a classic race condition (TOCTOU: Time-of-check to time-of-use).',
      coreInsight: 'Use Redis In-Memory data structures with atomic Lua scripts or Redis sorted sets (ZSET) to perform rate check and increment in a single atomic cycle.'
    },
    architectureNodes: [
      { id: 'client', label: 'Client / Attackers', type: 'client', description: 'Incoming burst of HTTP API traffic', x: 50, y: 150 },
      { id: 'gateway', label: 'API Gateway / Middleware', type: 'gateway', description: 'Envoy / Kong / Spring Cloud Gateway intercepting requests', x: 260, y: 150 },
      { id: 'rules', label: 'Rule Engine / Cache', type: 'storage', description: 'Config store: 5 req/sec for /login, 1000 req/sec for /search', x: 260, y: 300 },
      { id: 'redis', label: 'Redis Cluster (Atomic)', type: 'cache', description: 'In-memory sorted sets / token counters executing Lua scripts', x: 500, y: 150 },
      { id: 'backend', label: 'Backend Microservices', type: 'service', description: 'Protected business services processing approved requests', x: 740, y: 150 }
    ],
    architectureEdges: [
      { from: 'client', to: 'gateway', label: 'HTTP Request', protocol: 'HTTP/2', animated: true },
      { from: 'gateway', to: 'rules', label: 'Fetch Rule' },
      { from: 'gateway', to: 'redis', label: 'Atomic Lua Check', protocol: 'Redis Protocol', animated: true },
      { from: 'gateway', to: 'backend', label: 'Allow (200 OK)', protocol: 'gRPC' },
      { from: 'gateway', to: 'client', label: 'Drop (429 Rate Limited)' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Request Interception',
        description: 'Client sends API request to API Gateway. Gateway extracts client identifier (API Key, User ID, or IP address).',
        activeNodeIds: ['client', 'gateway'],
        highlightTip: 'Combine User ID + IP to prevent malicious users rotating IPs.'
      },
      {
        stepNumber: 2,
        title: 'Rule Match & Atomic Redis Evaluation',
        description: 'Gateway executes atomic Redis Lua script comparing current bucket count/timestamp against rule threshold.',
        activeNodeIds: ['gateway', 'redis', 'rules'],
        highlightTip: 'Atomic Lua scripts prevent race conditions in distributed multi-threaded environments.'
      },
      {
        stepNumber: 3,
        title: 'Allow or Throttle Decision',
        description: 'If within limit: Request forwarded to backend services with headers (X-Ratelimit-Remaining). If exceeded: Returns 429 Too Many Requests.',
        activeNodeIds: ['gateway', 'backend'],
        highlightTip: 'Include Retry-After header indicating seconds until the next token replenishes.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Algorithm Comparison: 5 Rate Limiting Paradigms',
        content: '1. **Token Bucket**: Tokens added at constant rate up to max capacity. Requests consume 1 token. Handles traffic bursts gracefully. (Used by AWS & Stripe).\n2. **Leaky Bucket**: Requests enter FIFO queue and leak out at constant rate. Smooths out traffic bursts into constant flow.\n3. **Fixed Window Counter**: Divides timeline into fixed 1-minute windows. Suffers from boundary burst issue (2x traffic at window edges).\n4. **Sliding Window Log**: Stores timestamps in Redis ZSET. High memory overhead but 100% accurate.\n5. **Sliding Window Counter**: Hybrid algorithm combining previous window weight with current window count. Low memory footprint with 99.9% accuracy.',
        codeSnippet: {
          language: 'lua',
          code: `-- Atomic Redis Token Bucket Lua Script
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local current = tonumber(redis.call('get', key) or "0")

if current + 1 > limit then
    return 0 -- Rejected (429)
else
    redis.call("INCRBY", key, 1)
    if current == 0 then
        redis.call("EXPIRE", key, ARGV[2])
    end
    return 1 -- Allowed (200)
end`
        }
      }
    ],
    tradeoffs: [
      {
        approachA: 'Token Bucket',
        approachB: 'Leaky Bucket',
        verdict: 'Token Bucket is standard for web APIs because it allows temporary bursts without delaying urgent traffic.',
        prosA: ['Supports short bursts of traffic', 'Memory efficient (2 values in Redis: timestamp + tokens)'],
        prosB: ['Guarantees constant outbound rate', 'Ideal for queuing backend jobs'],
        whenToUse: 'Token Bucket for REST APIs; Leaky Bucket for stable egress to rate-limited third parties.'
      }
    ],
    keyTakeaways: [
      { title: 'Redis Lua Script Atomicity', description: 'Eliminates read-modify-write race conditions in distributed systems.' },
      { title: 'Standard HTTP Headers', description: 'Always return X-Ratelimit-Limit, X-Ratelimit-Remaining, and Retry-After.' }
    ],
    hasInteractiveLab: true,
    labType: 'rate-limiter'
  },
  {
    id: 5,
    slug: 'consistent-hashing',
    number: '05',
    title: 'Design Consistent Hashing',
    category: 'Core Distributed Systems',
    difficulty: 'Intermediate',
    readTimeMin: 14,
    summary: 'Solve the hash % N rehash storm problem. Distribute keys evenly across a dynamic ring of cache servers with virtual nodes to avoid cascading outages.',
    problemStatement: 'When scaling from N to N+1 cache servers, traditional modular hashing (hash(key) % N) invalidates almost all cached keys, causing a catastrophic database thundering herd. How do we minimize key movement?',
    keyRequirements: {
      functional: ['Map keys to cache servers deterministically', 'Reassign minimal keys when servers are added or removed', 'Uniform data distribution without hot spots'],
      nonFunctional: ['O(log N) lookup time via binary search (hash ring)', 'Virtual nodes for balance and heterogeneity']
    },
    intuition: {
      analogy: 'Imagine a circular race track (0 to 2^32 - 1). 4 water stations (servers) are placed on the track. When a runner (key) is on the track, they keep running clockwise until they reach the first water station.',
      whyNaiveFails: 'In modular hashing `hash(key) % 4`, if 1 server dies, formula becomes `hash(key) % 3`. 75% to 99% of all existing keys map to completely wrong servers, instantly wiping the cache.',
      coreInsight: 'Map both servers and keys to the SAME circular hash ring. On server add/remove, only keys between the new node and its predecessor are redistributed (only 1/N keys moved on average).'
    },
    architectureNodes: [
      { id: 'client', label: 'Client / App Request', type: 'client', description: 'Key lookup: hash("user_98124")', x: 60, y: 150 },
      { id: 'ring', label: 'Consistent Hash Ring (0 -> 2^32-1)', type: 'gateway', description: 'Virtual Ring with clockwise binary search lookup', x: 300, y: 150 },
      { id: 'node0', label: 'Node A (v0, v1, v2)', type: 'cache', description: 'Cache server A virtual replicas', x: 560, y: 60 },
      { id: 'node1', label: 'Node B (v0, v1, v2)', type: 'cache', description: 'Cache server B virtual replicas', x: 740, y: 150 },
      { id: 'node2', label: 'Node C (v0, v1, v2)', type: 'cache', description: 'Cache server C virtual replicas', x: 560, y: 240 }
    ],
    architectureEdges: [
      { from: 'client', to: 'ring', label: 'Lookup Key', animated: true },
      { from: 'ring', to: 'node0', label: 'Clockwise Next (Node A)' },
      { from: 'ring', to: 'node1', label: 'Clockwise Next (Node B)' },
      { from: 'ring', to: 'node2', label: 'Clockwise Next (Node C)' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Hash Key onto Ring',
        description: 'Apply cryptographic hash (SHA-1 or MurmurHash3) to key: hash("user_photo_99") = 0x8F3A... maps to ring position.',
        activeNodeIds: ['client', 'ring'],
        highlightTip: 'MurmurHash3 is faster than MD5/SHA with excellent uniform distribution.'
      },
      {
        stepNumber: 2,
        title: 'Clockwise Traversal (Binary Search)',
        description: 'Scan clockwise along the 360-degree ring to locate the first server node whose position is >= key position.',
        activeNodeIds: ['ring', 'node0'],
        highlightTip: 'In-memory implementation uses a Red-Black Tree (std::map in C++ or TreeMap in Java) for O(log N) lookup.'
      },
      {
        stepNumber: 3,
        title: 'Dynamic Node Scaling & Minimal Rebalance',
        description: 'When Node D is added, only keys between Node D and its clockwise neighbor are reassigned. All other nodes remain 100% unaffected.',
        activeNodeIds: ['ring', 'node1', 'node2'],
        highlightTip: 'Average keys rehashed is strictly K / N (where K = total keys, N = server count).'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Why Virtual Nodes (Vnodes) are Mandatory',
        content: 'Without virtual nodes, servers end up with non-uniform partition slices on the ring. One server might own 60% of the ring while another owns 5%. Virtual nodes assign 100-300 virtual tokens per physical machine across the ring, reducing standard deviation of key distribution to < 5% and supporting heterogeneous hardware (beefy servers get 300 vnodes, smaller get 100).',
        codeSnippet: {
          language: 'typescript',
          code: `// Consistent Hash Ring with Virtual Nodes
class ConsistentHashRing {
  private ring = new Map<number, string>();
  private sortedKeys: number[] = [];

  constructor(private replicas: number = 150) {}

  addNode(node: string): void {
    for (let i = 0; i < this.replicas; i++) {
      const hash = this.hashFn(\`\${node}#VN\${i}\`);
      this.ring.set(hash, node);
      this.sortedKeys.push(hash);
    }
    this.sortedKeys.sort((a, b) => a - b);
  }

  getNode(key: string): string {
    if (this.sortedKeys.length === 0) throw new Error("Ring empty");
    const hash = this.hashFn(key);
    // Binary search for clockwise successor
    let idx = this.binarySearch(hash);
    return this.ring.get(this.sortedKeys[idx])!;
  }
}`
        }
      }
    ],
    tradeoffs: [
      {
        approachA: 'Standard Modular Hash (hash % N)',
        approachB: 'Consistent Hash Ring with VNodes',
        verdict: 'Consistent hashing is the gold standard for distributed caching (Memcached, Redis Cluster, Amazon Dynamo, Apache Cassandra, Discord).',
        prosA: ['O(1) trivial math', 'Zero memory metadata required'],
        prosB: ['Only 1/N keys rehashed on topology change', 'No cascading DB cache stampede', 'Balanced workload across machines'],
        whenToUse: 'Use consistent hashing for any distributed storage or cache system.'
      }
    ],
    keyTakeaways: [
      { title: 'Only 1/N Keys Move', description: 'Adding or removing a server never invalidates the entire cache cluster.' },
      { title: 'Virtual Nodes Balance Load', description: '100-200 virtual nodes ensure uniform partition distribution.' }
    ],
    hasInteractiveLab: true,
    labType: 'consistent-hashing'
  },
  {
    id: 6,
    slug: 'key-value-store',
    number: '06',
    title: 'Design A Key-Value Store',
    category: 'Storage & Data',
    difficulty: 'Advanced',
    readTimeMin: 16,
    summary: 'Design a distributed NoSQL Key-Value store like Amazon DynamoDB or Apache Cassandra. Covers CAP Theorem, Quorum Consensus (W + R > N), Vector Clocks, Gossip Protocol, Merkle Trees, and LSM-Trees.',
    problemStatement: 'Design a distributed, highly available, partition-tolerant key-value store supporting put(key, value) and get(key) with millisecond latency and automatic replication.',
    keyRequirements: {
      functional: ['put(key, value) and get(key) operations', 'Tunable consistency (Strong vs Eventual)', 'High availability across multiple datacenters'],
      nonFunctional: ['Sub-10ms P99 latency', 'Zero downtime during network partitions', 'Automatic self-healing & conflict resolution']
    },
    intuition: {
      analogy: 'Imagine a team of 3 assistants holding synchronized copies of an executive schedule. If 2 assistants agree on an appointment (Quorum W=2, R=2 out of N=3), the schedule is guaranteed correct even if 1 assistant is offline.',
      whyNaiveFails: 'Single-node key-value stores cannot survive network partitions or server crashes. Enforcing strict ACID across multi-region nodes causes massive write latency and total unavailability during network splits.',
      coreInsight: 'Adopt the Amazon Dynamo architecture: Consistent hashing for partitioning, Quorum Consensus (W + R > N) for tunable consistency, Vector Clocks for concurrent writes, Gossip protocol for failure detection, and LSM-Trees (SSTables) for high-speed writes.'
    },
    architectureNodes: [
      { id: 'coord', label: 'Coordinator Node', type: 'gateway', description: 'Receives client put/get and proxies to N replica nodes', x: 100, y: 150 },
      { id: 'nodeA', label: 'Replica Node A (MemTable + SSTable)', type: 'database', description: 'Primary partition holder', x: 420, y: 60 },
      { id: 'nodeB', label: 'Replica Node B (MemTable + SSTable)', type: 'database', description: 'Secondary partition replica', x: 420, y: 150 },
      { id: 'nodeC', label: 'Replica Node C (MemTable + SSTable)', type: 'database', description: 'Tertiary partition replica', x: 420, y: 240 },
      { id: 'gossip', label: 'Gossip Failure Detector', type: 'service', description: 'Periodic heartbeat protocol detecting node outages', x: 700, y: 150 }
    ],
    architectureEdges: [
      { from: 'coord', to: 'nodeA', label: 'Quorum Write (W=2)', animated: true },
      { from: 'coord', to: 'nodeB', label: 'Quorum Write (W=2)', animated: true },
      { from: 'coord', to: 'nodeC', label: 'Async Replication' },
      { from: 'nodeA', to: 'gossip', label: 'Heartbeat ping' },
      { from: 'nodeB', to: 'gossip', label: 'Heartbeat ping' },
      { from: 'nodeC', to: 'gossip', label: 'Heartbeat ping' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Client Request & Coordinator Routing',
        description: 'Client issues put("user:101", data). Coordinator hashes key and identifies top N=3 replica nodes on the consistent hash ring.',
        activeNodeIds: ['coord'],
        highlightTip: 'Any node in the cluster can act as a coordinator.'
      },
      {
        stepNumber: 2,
        title: 'Quorum Consensus Write (W=2, N=3)',
        description: 'Coordinator sends write to all 3 nodes in parallel. As soon as W=2 nodes write to MemTable and Write-Ahead Log (WAL), coordinator responds 200 Success to client.',
        activeNodeIds: ['coord', 'nodeA', 'nodeB'],
        highlightTip: 'Write-Ahead Log (WAL) ensures durability in case node crashes before MemTable is flushed to disk SSTable.'
      },
      {
        stepNumber: 3,
        title: 'Read Quorum & Conflict Resolution',
        description: 'On get(), coordinator queries R=2 replicas. Because W + R > N (2 + 2 > 3), at least one replica is guaranteed to hold the latest vector clock version.',
        activeNodeIds: ['coord', 'nodeA', 'nodeB'],
        highlightTip: 'Read repair triggers in background if one replica returns an outdated vector clock.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'LSM-Tree Storage Engine (Log-Structured Merge-Tree)',
        content: 'Why DynamoDB and Cassandra achieve 100k+ writes/sec: Writes are never random disk I/O. They append to an append-only WAL (Write-Ahead Log) and an in-memory sorted MemTable (SkipList/Red-Black Tree). When MemTable is full, it flushes to immutable SSTables (Sorted String Tables) on disk sequentially. Compaction runs in background to merge SSTables and remove tombstones.'
      }
    ],
    tradeoffs: [
      {
        approachA: 'Strong Consistency (W=3, R=1, N=3)',
        approachB: 'High Write Availability (W=1, R=3, N=3)',
        verdict: 'W=2, R=2 (Quorum) balances strong consistency with fault tolerance of 1 dead node.',
        prosA: ['Guaranteed freshest read', 'Zero conflict resolution needed'],
        prosB: ['Lightning fast writes', 'Can write even if 2 out of 3 nodes are down'],
        whenToUse: 'W+R > N for strong consistency; W=1 for high-throughput sensor logging.'
      }
    ],
    keyTakeaways: [
      { title: 'Quorum Formula: W + R > N', description: 'Ensures read and write sets overlap on at least one latest replica.' },
      { title: 'LSM-Trees Turn Random Writes into Sequential I/O', description: 'MemTable in RAM + SSTable on SSD for blazing write throughput.' }
    ],
    hasInteractiveLab: true,
    labType: 'key-value-store'
  },
  {
    id: 7,
    slug: 'unique-id-generator',
    number: '07',
    title: 'Design A Unique ID Generator In Distributed Systems',
    category: 'Core Distributed Systems',
    difficulty: 'Intermediate',
    readTimeMin: 12,
    summary: 'Generate 64-bit numerical, globally unique, time-sortable IDs at 100,000+ IDs/sec without a centralized lock. Dissects Twitter Snowflake architecture.',
    problemStatement: 'Auto-increment primary keys in a single MySQL database fail in distributed architectures. How do we generate 64-bit unique IDs that are roughly sortable by time across 1024 independent worker nodes?',
    keyRequirements: {
      functional: ['IDs must be globally unique', 'IDs must be 64-bit integers (fit in standard 64-bit DB integer / BigInt)', 'IDs must be roughly sortable by creation timestamp'],
      nonFunctional: ['Generate > 100,000 IDs/second per worker', 'Zero centralized lock contention', 'High availability and clock-drift resilience']
    },
    intuition: {
      analogy: 'Imagine a factory where every assembly station has a pre-assigned station badge (Machine ID). Whenever a product rolls off the line, the station prints: [Current Millisecond Timestamp] + [Station Badge] + [Local Counter 001]. No two stations can ever generate the same serial number.',
      whyNaiveFails: 'UUIDs (128-bit strings) are not 64-bit integers, cannot be sorted chronologically, and severely degrade B-tree index performance due to random insertion fragmentation. Centralized MySQL `auto_increment` ticket servers create a single point of failure and bottleneck.',
      coreInsight: 'Twitter Snowflake: Partition a 64-bit integer into 4 distinct bitfields: 1 sign bit (0) + 41 bits timestamp (69 years) + 5 bits datacenter ID (32) + 5 bits worker ID (32) + 12 bits sequence number (4096 IDs per ms per node).'
    },
    architectureNodes: [
      { id: 'client', label: 'App Servers / Microservices', type: 'client', description: 'Requesting next unique ID', x: 60, y: 150 },
      { id: 'snowflake1', label: 'Snowflake Worker 1 (DC:0, W:1)', type: 'service', description: 'Generates up to 4,096 IDs / millisecond', x: 340, y: 80 },
      { id: 'snowflake2', label: 'Snowflake Worker 2 (DC:0, W:2)', type: 'service', description: 'Independent 64-bit bitshift engine', x: 340, y: 220 },
      { id: 'zookeeper', label: 'Zookeeper / Etcd', type: 'storage', description: 'Assigns unique datacenter & worker ID on boot', x: 600, y: 150 },
      { id: 'db', label: 'Distributed Database', type: 'database', description: 'Efficient 64-bit clustered B-Tree indexing', x: 800, y: 150 }
    ],
    architectureEdges: [
      { from: 'client', to: 'snowflake1', label: 'Get ID()', animated: true },
      { from: 'zookeeper', to: 'snowflake1', label: 'Assign Worker ID' },
      { from: 'zookeeper', to: 'snowflake2', label: 'Assign Worker ID' },
      { from: 'snowflake1', to: 'db', label: 'Insert 64-bit ID' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Bitfield Allocation (64 Bits)',
        description: 'Bit 0: Sign bit (0). Bits 1-41: Epoch Milliseconds (41 bits = 2^41 ms ≈ 69 years). Bits 42-46: Datacenter ID (5 bits = 32 DCs). Bits 47-51: Worker ID (5 bits = 32 workers). Bits 52-63: Sequence Number (12 bits = 4,096/ms).',
        activeNodeIds: ['snowflake1'],
        highlightTip: 'Max throughput across 1,024 workers = 1024 * 4,096,000 = 4.19 Billion IDs/second!'
      },
      {
        stepNumber: 2,
        title: 'Atomic Generation & Bitshifting',
        description: 'Worker reads system clock. If same millisecond, increments local sequence counter. If counter reaches 4096, waits for next millisecond.',
        activeNodeIds: ['snowflake1', 'zookeeper'],
        highlightTip: 'Bitwise shift: (timestamp << 22) | (datacenterId << 17) | (workerId << 12) | sequence.'
      },
      {
        stepNumber: 3,
        title: 'Handling NTP Clock Drift',
        description: 'If system clock drifts backwards (NTP synchronization), worker pauses generation or throws an error until current time catches up with last recorded timestamp.',
        activeNodeIds: ['snowflake1'],
        highlightTip: 'Using a monotonic clock API avoids backward NTP jumps.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Snowflake 64-bit Bitshift Implementation',
        content: 'Direct binary arithmetic avoids locks and network calls.',
        codeSnippet: {
          language: 'typescript',
          code: `class SnowflakeIdGenerator {
  private readonly EPOCH = 1609459200000n; // 2021-01-01 custom epoch
  private readonly WORKER_BITS = 5n;
  private readonly DC_BITS = 5n;
  private readonly SEQ_BITS = 12n;

  private sequence = 0n;
  private lastTimestamp = -1n;

  constructor(private datacenterId: bigint, private workerId: bigint) {}

  public nextId(): bigint {
    let now = BigInt(Date.now());
    if (now < this.lastTimestamp) throw new Error("Clock moved backwards!");

    if (now === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & 4095n;
      if (this.sequence === 0n) {
        while (now <= this.lastTimestamp) { now = BigInt(Date.now()); }
      }
    } else {
      this.sequence = 0n;
    }
    this.lastTimestamp = now;

    return ((now - this.EPOCH) << 22n) |
           (this.datacenterId << 17n) |
           (this.workerId << 12n) |
           this.sequence;
  }
}`
        }
      }
    ],
    tradeoffs: [
      {
        approachA: 'UUID v4 (128-bit random)',
        approachB: 'Twitter Snowflake (64-bit ID)',
        verdict: 'Snowflake is vastly superior for database primary keys and time-series ordering.',
        prosA: ['Completely decentralized', 'No worker ID coordination needed'],
        prosB: ['64-bit integer fits in DB bigint', 'Chronologically sortable', 'High index locality'],
        whenToUse: 'Use Snowflake for database IDs; UUID for one-off trace IDs.'
      }
    ],
    keyTakeaways: [
      { title: '64-bit Efficiency', description: '41-bit timestamp + 10-bit node ID + 12-bit sequence.' },
      { title: 'Time Sortability', description: 'Newer items naturally index at the end of B-Trees, preventing random fragmentation.' }
    ],
    hasInteractiveLab: true,
    labType: 'unique-id'
  },
  {
    id: 8,
    slug: 'url-shortener',
    number: '08',
    title: 'Design A URL Shortener',
    category: 'Real-World Scale Systems',
    difficulty: 'Intermediate',
    readTimeMin: 12,
    summary: 'Design TinyURL / Bit.ly. Compares Hash + Collision Resolution vs Distributed Unique ID + Base62 Encoding, Bloom Filters, 301 vs 302 redirects, and caching.',
    problemStatement: 'Design a scalable URL shortening service like TinyURL handling 100M new URLs per month with 100:1 read-to-write ratio and sub-10ms redirection.',
    keyRequirements: {
      functional: ['Shorten long URL to 7-character string (e.g. tinyurl.com/a9B8xQ1)', 'Redirect short URL to original destination', 'Optional custom aliases and expiration dates'],
      nonFunctional: ['Sub-10ms redirect latency', 'High availability (99.99%)', 'URLs must not be easily guessable']
    },
    intuition: {
      analogy: 'A coat check ticket at a theater. Instead of carrying your heavy winter coat everywhere, you hand it over and receive a tiny token #42. When you present #42, the attendant hands back your exact coat.',
      whyNaiveFails: 'Hashing the URL with MD5 or SHA-256 and taking the first 7 characters causes frequent hash collisions that require expensive retry loops in the database.',
      coreInsight: 'Combine a Distributed Unique ID Generator (Snowflake or DB Auto-increment) with Base62 encoding ([0-9, a-z, A-Z]). 62^7 = 3.5 Trillion unique combinations, with zero hash collisions!'
    },
    architectureNodes: [
      { id: 'user', label: 'User / Browser', type: 'client', description: 'Navigating to http://tiny.cc/a8Kz9Q', x: 60, y: 150 },
      { id: 'lb', label: 'Load Balancer', type: 'gateway', description: 'Distributes traffic across API servers', x: 250, y: 150 },
      { id: 'api', label: 'URL Shortener API', type: 'service', description: 'Handles encoding & redirect routing', x: 450, y: 150 },
      { id: 'cache', label: 'Redis Cache (80/20)', type: 'cache', description: 'Caches top 20% most accessed short URLs in RAM', x: 680, y: 80 },
      { id: 'db', label: 'Distributed NoSQL / MySQL', type: 'database', description: 'Persistent mapping: { id, short_url, long_url, created_at }', x: 680, y: 220 }
    ],
    architectureEdges: [
      { from: 'user', to: 'lb', label: 'GET /a8Kz9Q', animated: true },
      { from: 'lb', to: 'api', label: 'Forward request' },
      { from: 'api', to: 'cache', label: '1. Check Redis', protocol: 'Redis Protocol' },
      { from: 'api', to: 'db', label: '2. Cache Miss Query', protocol: 'SQL' },
      { from: 'api', to: 'user', label: '301 / 302 Redirect' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'URL Shortening Request (Write Path)',
        description: 'Client POSTs long URL. API service generates next 64-bit ID from Snowflake generator, converts ID to Base62 (e.g. ID 2009215674938 -> "7bA9kL2"), and saves mapping in DB.',
        activeNodeIds: ['api', 'db'],
        highlightTip: 'Base62 uses [0-9, a-z, A-Z] which are all URL-safe characters.'
      },
      {
        stepNumber: 2,
        title: 'Redirection Request (Read Path)',
        description: 'Client requests tinyurl.com/7bA9kL2. Service checks Redis cache first. If found, instantly returns HTTP 301/302 redirect.',
        activeNodeIds: ['user', 'api', 'cache'],
        highlightTip: '90%+ of redirect requests hit Redis RAM cache in < 1ms.'
      }
    ],
    deepDiveTopics: [
      {
        title: '301 Moved Permanently vs 302 Found Redirect',
        content: '• **301 Permanent**: The browser caches the redirection permanently. Subsequent requests go directly from browser to long URL without hitting your shortener server. Saves server bandwidth, but disables click analytics.\n• **302 Temporary**: The browser always sends requests to the shortener server first. Essential when tracking click counts, analytics, geo-location, and referrer telemetry.'
      }
    ],
    tradeoffs: [
      {
        approachA: 'Hash (MD5/SHA256) + Truncation',
        approachB: 'Unique ID + Base62 Encoding',
        verdict: 'Unique ID + Base62 is strictly superior: 0 collisions, predictable length, mathematically guaranteed.',
        prosA: ['Stateless'],
        prosB: ['Zero collision handling', 'Bijective 1-to-1 conversion', '3.5 Trillion combinations at 7 chars'],
        whenToUse: 'Always use Base62 conversion for URL shorteners.'
      }
    ],
    keyTakeaways: [
      { title: 'Base62 Math', description: '62^7 = 3.52 Trillion URLs. 62^8 = 218 Trillion URLs.' },
      { title: 'Use 302 for Analytics', description: '302 Temporary Redirect ensures every click passes through your analytics tracker.' }
    ],
    hasInteractiveLab: true,
    labType: 'url-shortener'
  },
  {
    id: 9,
    slug: 'web-crawler',
    number: '09',
    title: 'Design A Web Crawler',
    category: 'Real-World Scale Systems',
    difficulty: 'Advanced',
    readTimeMin: 15,
    summary: 'Design a distributed Google/Bing search index crawler downloading 1 Billion web pages/month. Covers URL Frontier, Politeness & Priority, DNS Resolver caching, Duplicate detection, and Spider Traps.',
    problemStatement: 'Design a scalable web crawler capable of traversing and indexing 1 billion web pages per month while respecting robots.txt politeness, avoiding infinite loops (spider traps), and deduplicating content.',
    keyRequirements: {
      functional: ['Crawl web pages starting from seed URLs', 'Extract text and discover new URLs', 'Store indexed content in distributed storage'],
      nonFunctional: ['Scalability across hundreds of crawler workers', 'Politeness: Do not DDoS target web servers', 'Robustness against spider traps & malformed HTML']
    },
    intuition: {
      analogy: 'A worldwide team of librarians exploring a library with infinite expanding bookshelves. Each librarian grabs a book, catalogs its summary, writes down all referenced books, and queues those references for other librarians while taking care not to bother the same shelf too frequently.',
      whyNaiveFails: 'A single multi-threaded crawler will rapidly flood target hosts (causing IP bans), get trapped in infinite calendar query loops (spider traps), and exhaust memory storing duplicate URLs.',
      coreInsight: 'Decouple URL scheduling using a dual-queue URL Frontier: Politeness Queues (one FIFO queue per target hostname with delay timer) + Priority Queues (PageRank importance scoring).'
    },
    architectureNodes: [
      { id: 'seed', label: 'Seed URLs', type: 'client', description: 'Curated high-reputation starting points (e.g. wikipedia.org)', x: 50, y: 150 },
      { id: 'frontier', label: 'URL Frontier (Priority + Politeness)', type: 'queue', description: 'Dual queue: Priority selector + Host-based politeness FIFO queues', x: 260, y: 150 },
      { id: 'dns', label: 'Async DNS Cache', type: 'cache', description: 'In-memory DNS resolver avoiding external network bottleneck', x: 480, y: 60 },
      { id: 'fetcher', label: 'HTML Fetcher Workers', type: 'worker', description: 'Distributed download cluster respecting robots.txt', x: 480, y: 180 },
      { id: 'parser', label: 'Parser & Content Filter', type: 'service', description: 'Extracts text, strips scripts, detects mime-type', x: 700, y: 120 },
      { id: 'dedup', label: 'Content & URL Deduplicator', type: 'storage', description: 'Bloom filter for seen URLs & SimHash for duplicate content', x: 700, y: 240 }
    ],
    architectureEdges: [
      { from: 'seed', to: 'frontier', label: 'Seed Init' },
      { from: 'frontier', to: 'fetcher', label: 'Dispatch Next URL', animated: true },
      { from: 'fetcher', to: 'dns', label: 'Resolve Host IP' },
      { from: 'fetcher', to: 'parser', label: 'Raw HTML Stream' },
      { from: 'parser', to: 'dedup', label: 'SimHash fingerprint' },
      { from: 'dedup', to: 'frontier', label: 'Queue New URLs', animated: true }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'URL Frontier Politeness Scheduling',
        description: 'Frontier checks the target domain queue. If 500ms has elapsed since the last request to this domain, pops the next URL.',
        activeNodeIds: ['frontier'],
        highlightTip: 'Never send concurrent requests to the same hostname.'
      },
      {
        stepNumber: 2,
        title: 'Fetch & DNS Resolution',
        description: 'Worker queries local DNS cache (sub-millisecond) and downloads HTML with strict connection timeout.',
        activeNodeIds: ['dns', 'fetcher'],
        highlightTip: 'DNS resolution is a hidden bottleneck in web crawling; aggressive local caching is mandatory.'
      },
      {
        stepNumber: 3,
        title: 'Content Deduplication & Link Extraction',
        description: 'SimHash computes 64-bit document fingerprint. If novel, text is saved to document store and new hyperlinks are pushed to Bloom Filter.',
        activeNodeIds: ['parser', 'dedup', 'frontier'],
        highlightTip: 'Bloom filters determine URL uniqueness in O(1) time using minimal RAM.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Combating Spider Traps',
        content: 'Spider traps are infinite dynamic loops (e.g. `/calendar?year=2026&month=12...` or `/dir1/dir2/dir1/dir2/...`). Mitigations include: max URL length thresholds (e.g. 512 chars), URL path depth limits (e.g. max 5 sub-paths), anti-crawler CAPTCHA detection, and domain crawling budget limits.'
      }
    ],
    tradeoffs: [
      {
        approachA: 'Breadth-First Search (BFS)',
        approachB: 'PageRank Priority URL Frontier',
        verdict: 'Priority + Politeness URL Frontier balances crawl quality with server safety.',
        prosA: ['Simple to implement'],
        prosB: ['Crawls high-value authoritative pages first', 'Prevents accidental DoS against small sites'],
        whenToUse: 'Always use dual-queue URL Frontier at scale.'
      }
    ],
    keyTakeaways: [
      { title: 'Politeness First', description: 'One queue per host with minimum delay interval between crawls.' },
      { title: 'Bloom Filters for URLs', description: 'Fast, compact set-membership check for 10B+ crawled URLs.' }
    ],
    hasInteractiveLab: false,
    labType: 'generic'
  },
  {
    id: 10,
    slug: 'notification-system',
    number: '10',
    title: 'Design A Notification System',
    category: 'Real-World Scale Systems',
    difficulty: 'Intermediate',
    readTimeMin: 13,
    summary: 'Design a multi-channel notification engine for iOS APNs, Android FCM, SMS (Twilio), and Email (SendGrid) with rate limiting, template engines, and deduplication.',
    problemStatement: 'Design a global notification infrastructure handling 10 million mobile push notifications, 1 million SMS, and 5 million emails daily with sub-second delivery.',
    keyRequirements: {
      functional: ['Support Mobile Push (iOS APNs, Android FCM), SMS, and Email', 'Dynamic template rendering with user personalization', 'User notification preference center (opt-in/opt-out)'],
      nonFunctional: ['Guaranteed delivery without duplicates', 'Rate limiting to avoid spamming users', 'High throughput with asynchronous worker queues']
    },
    intuition: {
      analogy: 'A centralized international post office. Different departments handle express couriers (push notifications), registered letters (SMS), and standard flyers (emails). Each recipient has a mail preference card indicating which mail they accept.',
      whyNaiveFails: 'Synchronous API calls to third-party vendors (Apple APNs, Twilio) cause cascading connection pool exhaustion when external gateways experience latency.',
      coreInsight: 'Decouple notification producers from delivery channels using dedicated message queues per provider (Kafka/RabbitMQ) with deduplication keys and distributed rate limiters.'
    },
    architectureNodes: [
      { id: 'services', label: 'Microservices (Orders, Auth)', type: 'service', description: 'Services triggering notifications via internal API', x: 50, y: 150 },
      { id: 'notif_server', label: 'Notification Server', type: 'gateway', description: 'Validates input, checks user opt-out preferences & rate limits', x: 260, y: 150 },
      { id: 'redis_dedup', label: 'Deduplication Cache', type: 'cache', description: 'Redis cache checking idempotency keys', x: 260, y: 300 },
      { id: 'q_push', label: 'Push Queue (APNs/FCM)', type: 'queue', description: 'Dedicated queue for mobile push', x: 500, y: 60 },
      { id: 'q_sms', label: 'SMS Queue (Twilio)', type: 'queue', description: 'Dedicated queue for SMS messages', x: 500, y: 150 },
      { id: 'q_email', label: 'Email Queue (SendGrid)', type: 'queue', description: 'Dedicated queue for bulk/transactional email', x: 500, y: 240 },
      { id: 'providers', label: 'Third-Party Gateways', type: 'storage', description: 'APNs, FCM, Twilio, SendGrid API endpoints', x: 750, y: 150 }
    ],
    architectureEdges: [
      { from: 'services', to: 'notif_server', label: 'POST /v1/notify', animated: true },
      { from: 'notif_server', to: 'redis_dedup', label: 'Check Deduplication' },
      { from: 'notif_server', to: 'q_push', label: 'Route Push' },
      { from: 'notif_server', to: 'q_sms', label: 'Route SMS' },
      { from: 'notif_server', to: 'q_email', label: 'Route Email' },
      { from: 'q_push', to: 'providers', label: 'Deliver APNs/FCM' },
      { from: 'q_sms', to: 'providers', label: 'Deliver SMS' },
      { from: 'q_email', to: 'providers', label: 'Deliver Email' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Validation & Deduplication',
        description: 'Notification service checks idempotency key in Redis (e.g. `order_1029_shipped_sms`). If duplicate within 1 hour, drops request.',
        activeNodeIds: ['notif_server', 'redis_dedup'],
        highlightTip: 'Prevents sending duplicate charged SMS to customers on retry loops.'
      },
      {
        stepNumber: 2,
        title: 'User Preference & Channel Routing',
        description: 'Queries user settings database. If user disabled promotional push, filters out. Otherwise, pushes job into channel-specific queue.',
        activeNodeIds: ['notif_server', 'q_push', 'q_sms', 'q_email'],
        highlightTip: 'Isolate queues per provider so a slow email provider never blocks critical SMS OTPs.'
      },
      {
        stepNumber: 3,
        title: 'Asynchronous Worker Delivery',
        description: 'Worker pool consumes from message queue, renders localized templates, and makes retryable HTTP/2 requests to APNs/FCM.',
        activeNodeIds: ['q_push', 'providers'],
        highlightTip: 'APNs connection pooling with HTTP/2 multiplexing yields 10x throughput over HTTP/1.1.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Reliability: Handling APNs / Third-Party Outages',
        content: 'Never block on third-party APIs. Implement exponential backoff with jitter and a Dead-Letter Queue (DLQ). If a message fails after 5 retries, send to DLQ for engineer alert and inspection.'
      }
    ],
    tradeoffs: [
      {
        approachA: 'Single Monolithic Notification Queue',
        approachB: 'Dedicated Per-Channel Queue Isolation',
        verdict: 'Per-channel queues prevent head-of-line blocking (e.g., bulk email batch blocking instant OTP SMS).',
        prosA: ['Fewer queues to manage'],
        prosB: ['Fault isolation', 'Independent worker auto-scaling', 'High priority lane for 2FA SMS'],
        whenToUse: 'Always isolate queues by delivery channel.'
      }
    ],
    keyTakeaways: [
      { title: 'Separate Provider Queues', description: 'Email spikes must never delay instant SMS 2FA codes.' },
      { title: 'Idempotency Keys', description: 'Prevent accidental duplicate push/SMS delivery.' }
    ],
    hasInteractiveLab: false,
    labType: 'generic'
  },
  {
    id: 11,
    slug: 'news-feed-system',
    number: '11',
    title: 'Design A News Feed System',
    category: 'Real-World Scale Systems',
    difficulty: 'Intermediate',
    readTimeMin: 15,
    summary: 'Design Facebook / Twitter / Instagram news feeds. Deep dive into Fanout-on-Write (Push model) vs Fanout-on-Read (Pull model), Hybrid Fanout for celebrities, and Feed Caching architectures.',
    problemStatement: 'Design a real-time news feed system for 500M DAU where users can publish posts and load a personalized chronologically ordered feed of followed friends in < 200ms.',
    keyRequirements: {
      functional: ['Publish new posts (text, photos, videos)', 'Generate and retrieve customized news feeds for followers', 'Paginate feed smoothly'],
      nonFunctional: ['P99 Feed retrieval latency < 200ms', 'Fast post dissemination (live within 5 seconds)', 'Handle celebrity accounts with 100M+ followers']
    },
    intuition: {
      analogy: 'Think of physical postal mailboxes. Option A (Push): When you send a newsletter, the postman places a copy in every single friend’s mailbox ahead of time. Option B (Pull): You leave the letter on your porch, and friends visit your porch to read it when they want.',
      whyNaiveFails: 'Fanout-on-write to a celebrity with 100 Million followers (like Cristiano Ronaldo or Taylor Swift) requires writing 100 million cache entries in Redis for a single tweet, causing massive queue lag (the "hotkey / celebrity problem").',
      coreInsight: 'Hybrid Fanout Architecture: Standard users use Fanout-on-Write (instant feed cache retrieval). Celebrities (users with > 50k followers) use Fanout-on-Read: their posts are dynamically merged into the follower’s feed at read time.'
    },
    architectureNodes: [
      { id: 'user', label: 'User Publishing Post', type: 'client', description: 'User publishes photo / status update', x: 50, y: 150 },
      { id: 'lb', label: 'Load Balancer', type: 'gateway', description: 'Layer 7 Gateway', x: 220, y: 150 },
      { id: 'post_svc', label: 'Post Service', type: 'service', description: 'Writes post metadata & image CDN links to DB', x: 400, y: 80 },
      { id: 'fanout_svc', label: 'Fanout Worker Cluster', type: 'worker', description: 'Fetches follower graph and pushes post_id into follower feed caches', x: 620, y: 80 },
      { id: 'feed_cache', label: 'Redis Feed Cache', type: 'cache', description: 'Stores user_id -> List<post_id> (ZSET sorted by timestamp)', x: 800, y: 150 },
      { id: 'feed_svc', label: 'News Feed Service', type: 'service', description: 'Retrieves cached post IDs, merges celebrity posts, hydrates user & media data', x: 400, y: 220 },
      { id: 'graph_db', label: 'Follower Graph DB', type: 'database', description: 'Social relationship graph (who follows whom)', x: 620, y: 280 }
    ],
    architectureEdges: [
      { from: 'user', to: 'lb', label: 'POST /v1/feed', animated: true },
      { from: 'lb', to: 'post_svc', label: 'Publish Post' },
      { from: 'post_svc', to: 'fanout_svc', label: 'Trigger Fanout (Kafka)' },
      { from: 'fanout_svc', to: 'graph_db', label: 'Get Followers' },
      { from: 'fanout_svc', to: 'feed_cache', label: 'RPUSH / ZADD feed' },
      { from: 'lb', to: 'feed_svc', label: 'GET /v1/feed' },
      { from: 'feed_svc', to: 'feed_cache', label: 'Read Sorted Post IDs' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Feed Publishing (Write Path)',
        description: 'User creates post. Post service persists content to DB and emits `PostCreatedEvent` to Kafka message queue.',
        activeNodeIds: ['user', 'post_svc'],
        highlightTip: 'Database stores { post_id, author_id, content, created_at }.'
      },
      {
        stepNumber: 2,
        title: 'Fanout Worker Execution',
        description: 'Fanout workers read event, fetch author’s followers from graph DB. For non-celebrity authors, workers push `post_id` into each follower’s Redis timeline cache.',
        activeNodeIds: ['fanout_svc', 'graph_db', 'feed_cache'],
        highlightTip: 'Feed cache only stores lightweight post_id (64-bit int), not full post text/images.'
      },
      {
        stepNumber: 3,
        title: 'Feed Retrieval (Read Path & Hydration)',
        description: 'Follower opens app. Feed service reads list of post IDs from Redis in < 2ms, pulls celebrity posts on-the-fly, and hydrates post objects from Redis Object Cache.',
        activeNodeIds: ['feed_svc', 'feed_cache'],
        highlightTip: 'Multi-get (MGET) hydrates 20 posts in a single round-trip network packet.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Redis Sorted Set (ZSET) Feed Architecture',
        content: 'Each user’s feed timeline is modeled as a Redis ZSET: `Key = user_feed:{userId}`, `Score = timestamp (millisecond)`, `Member = postId`. Fetching the latest 20 posts is a single `ZREVRANGEBYSCORE` command executed in O(log(N) + M) time (microseconds). Cap each timeline at 500-800 post IDs to bound RAM.'
      }
    ],
    tradeoffs: [
      {
        approachA: 'Fanout-on-Write (Push Model)',
        approachB: 'Fanout-on-Read (Pull Model)',
        verdict: 'Hybrid model is the industry standard (Push for 99% of users, Pull for celebrities).',
        prosA: ['Instant feed read (O(1) from cache)', 'Low database load on feed reads'],
        prosB: ['Zero write multiplication for celebrities', 'Inactive users consume 0 compute'],
        whenToUse: 'Hybrid fanout balances fast reads for normal users with zero lag for celebrity broadcasts.'
      }
    ],
    keyTakeaways: [
      { title: 'Store IDs in Feed Cache', description: 'Store only { post_id, timestamp } in feed cache; hydrate post payloads separately.' },
      { title: 'Hybrid Celebrity Fanout', description: 'Pull celebrity posts at read time; push regular user posts at write time.' }
    ],
    hasInteractiveLab: true,
    labType: 'newsfeed'
  },
  {
    id: 12,
    slug: 'chat-system',
    number: '12',
    title: 'Design A Chat System',
    category: 'Real-World Scale Systems',
    difficulty: 'Advanced',
    readTimeMin: 16,
    summary: 'Design WhatsApp / Discord / Slack. Covers WebSockets vs Long Polling, Stateful connection managers, Presence servers, Message sync across multiple devices, and Cassandra storage.',
    problemStatement: 'Design a distributed real-time messaging system supporting 1-on-1 chat and 500-member group chats with instant delivery, online presence status, and cross-device sync.',
    keyRequirements: {
      functional: ['Low-latency 1-on-1 and group messaging', 'Real-time online/offline presence indicators', 'Message synchronization across multiple user devices (phone, laptop, web)'],
      nonFunctional: ['Sub-100ms end-to-end message delivery', 'Horizontal scalability to 10M+ concurrent open WebSocket connections', 'Persistent chat history storage']
    },
    intuition: {
      analogy: 'Traditional HTTP is like a telephone call where you hang up after every single sentence and redial. WebSockets maintain an open phone line between client and server so either side can speak immediately with zero handshake overhead.',
      whyNaiveFails: 'HTTP polling or long polling drains mobile device battery and creates massive TCP handshake overhead for millions of concurrent users.',
      coreInsight: 'Use persistent bidirectional WebSockets for active clients. Maintain an in-memory Redis connection map (`userId -> chat_server_ip`) so Chat Servers can route messages directly to the recipient’s active WebSocket connection.'
    },
    architectureNodes: [
      { id: 'userA', label: 'User A (Sender)', type: 'client', description: 'Connected via WebSocket', x: 50, y: 80 },
      { id: 'userB', label: 'User B (Recipient)', type: 'client', description: 'Connected via WebSocket', x: 50, y: 220 },
      { id: 'ws_cluster1', label: 'Chat Server Cluster 1', type: 'service', description: 'Maintains open WebSocket to User A', x: 280, y: 80 },
      { id: 'ws_cluster2', label: 'Chat Server Cluster 2', type: 'service', description: 'Maintains open WebSocket to User B', x: 280, y: 220 },
      { id: 'session_redis', label: 'User Session Cache (Redis)', type: 'cache', description: 'Maps UserB -> ChatServer2 IP', x: 520, y: 150 },
      { id: 'presence_svc', label: 'Presence Server', type: 'service', description: 'Heartbeat manager tracking online status', x: 520, y: 270 },
      { id: 'mq_chat', label: 'Kafka / RabbitMQ', type: 'queue', description: 'Decoupled chat message dispatcher', x: 740, y: 80 },
      { id: 'cassandra_db', label: 'Apache Cassandra (Chat Store)', type: 'database', description: 'High write-throughput NoSQL keyed by (chat_id, message_id)', x: 740, y: 220 }
    ],
    architectureEdges: [
      { from: 'userA', to: 'ws_cluster1', label: 'WebSocket Send', animated: true },
      { from: 'ws_cluster1', to: 'session_redis', label: 'Lookup User B Server' },
      { from: 'ws_cluster1', to: 'mq_chat', label: 'Publish message' },
      { from: 'mq_chat', to: 'ws_cluster2', label: 'Route to Server 2' },
      { from: 'ws_cluster2', to: 'userB', label: 'WebSocket Push', animated: true },
      { from: 'ws_cluster1', to: 'cassandra_db', label: 'Persist chat' },
      { from: 'userA', to: 'presence_svc', label: 'Heartbeat Ping (5s)' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Connection Handshake & Session Registration',
        description: 'User logs in. Client establishes persistent WebSocket connection with Chat Server 1. Chat Server 1 writes `userA -> chat_server_1_ip` to Redis session store.',
        activeNodeIds: ['userA', 'ws_cluster1', 'session_redis'],
        highlightTip: 'WebSocket is upgraded from HTTP/1.1 via `101 Switching Protocols`.'
      },
      {
        stepNumber: 2,
        title: '1-on-1 Message Routing',
        description: 'User A sends message to User B. Chat Server 1 checks Redis, finds User B is on Chat Server 2. Message is dispatched across internal network/MQ to Chat Server 2.',
        activeNodeIds: ['ws_cluster1', 'session_redis', 'mq_chat', 'ws_cluster2'],
        highlightTip: 'If User B is offline, message triggers a Mobile Push Notification via APNs/FCM.'
      },
      {
        stepNumber: 3,
        title: 'Instant Delivery & Cassandra Persistence',
        description: 'Chat Server 2 pushes message over active WebSocket to User B. Message is asynchronously persisted to Cassandra with `(chat_id, message_id)` composite key.',
        activeNodeIds: ['ws_cluster2', 'userB', 'cassandra_db'],
        highlightTip: 'Cassandra handles massive append-only sequential writes with LSM-Trees.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Online Presence Heartbeat Mechanism',
        content: 'Clients send a lightweight heartbeat ping every 5 seconds to the Presence Server. The server refreshes a Redis TTL key: `SET presence:{userId} "online" EX 15`. If no ping arrives for 15 seconds, user status automatically flips to offline without requiring complex disconnect handlers.'
      }
    ],
    tradeoffs: [
      {
        approachA: 'HTTP Long Polling',
        approachB: 'Bidirectional WebSockets',
        verdict: 'WebSockets are the industry standard for real-time chat (Discord, Slack, WhatsApp).',
        prosA: ['Standard HTTP firewall traversal', 'Stateless load balancing'],
        prosB: ['Lowest latency', 'Zero per-message HTTP header overhead (2 bytes vs 800 bytes)', 'True full-duplex bi-directional communication'],
        whenToUse: 'WebSockets for chat; Long polling only as fallback for legacy restrictive corporate firewalls.'
      }
    ],
    keyTakeaways: [
      { title: 'WebSockets for Bidirectional Speed', description: 'Persistent TCP connections eliminate HTTP handshakes.' },
      { title: 'Cassandra for Chat History', description: 'Composite key (chat_id, message_id) allows fast ranged queries ordered by time.' }
    ],
    hasInteractiveLab: false,
    labType: 'generic'
  },
  {
    id: 13,
    slug: 'search-autocomplete',
    number: '13',
    title: 'Design A Search Autocomplete System',
    category: 'Real-World Scale Systems',
    difficulty: 'Intermediate',
    readTimeMin: 14,
    summary: 'Design Google / Amazon instant search autocomplete. Deep dives into Trie (Prefix Tree) data structures, top-K precomputations, cache filtering, and real-time query aggregation.',
    problemStatement: 'Design a search query autocomplete system returning the top 5 most popular query completions matching a user’s prefix in < 50ms for 10M searches/sec.',
    keyRequirements: {
      functional: ['Return top 5 suggestions matching query prefix in real time', 'Rank suggestions by historical frequency/popularity', 'Support dynamic data updates'],
      nonFunctional: ['Sub-50ms P99 latency (critical for typing experience)', 'High availability and fault tolerance', 'Support international character sets']
    },
    intuition: {
      analogy: 'A smart dictionary organized like a branching family tree. When you type "sy", you immediately land on the "sy" branch where the 5 most popular words ("system design", "syntax", "synonym") are already highlighted at the node.',
      whyNaiveFails: 'Executing `SELECT query FROM searches WHERE query LIKE "abc%" ORDER BY frequency DESC LIMIT 5` on relational databases scans millions of rows and grinds the DB to a halt at 1,000 QPS.',
      coreInsight: 'Trie Data Structure with Precomputed Top-K Suggestions cached inside each node. Instead of traversing child branches during query time, each Trie node directly holds an array of top 5 completions.'
    },
    architectureNodes: [
      { id: 'client', label: 'User Typing in Search Bar', type: 'client', description: 'Sends query prefix: "sys"', x: 50, y: 150 },
      { id: 'gateway', label: 'API Gateway & Rate Limiter', type: 'gateway', description: 'Applies client debouncing & rate checks', x: 260, y: 150 },
      { id: 'trie_cache', label: 'In-Memory Trie Server', type: 'cache', description: 'RAM-resident Trie structure with precomputed top 5 queries per node', x: 500, y: 80 },
      { id: 'redis_cache', label: 'Redis Prefix Cache', type: 'cache', description: 'Caches common prefix query results (e.g. "sys" -> ["system design"])', x: 500, y: 220 },
      { id: 'agg_service', label: 'Analytics Aggregation Worker', type: 'worker', description: 'Aggregates hourly search logs and rebuilds Trie offline', x: 740, y: 150 }
    ],
    architectureEdges: [
      { from: 'client', to: 'gateway', label: 'GET /complete?q=sys', animated: true },
      { from: 'gateway', to: 'redis_cache', label: '1. Check Prefix Cache' },
      { from: 'gateway', to: 'trie_cache', label: '2. Query In-Memory Trie' },
      { from: 'client', to: 'agg_service', label: 'Async Search Log Stream' },
      { from: 'agg_service', to: 'trie_cache', label: 'Weekly Trie Snapshot Update' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Client Debounce & Request Dispatch',
        description: 'Client waits 100ms after user stops typing before sending HTTP request to avoid flooding API on every keystroke.',
        activeNodeIds: ['client', 'gateway'],
        highlightTip: 'Client debouncing reduces autocomplete backend traffic by over 60%.'
      },
      {
        stepNumber: 2,
        title: 'In-Memory Trie Lookup',
        description: 'Server navigates Trie nodes: `root -> "s" -> "y" -> "s"`. At node "s", precomputed array `["system design", "system", "sysadmin"]` is read in O(p) time (where p = prefix length).',
        activeNodeIds: ['gateway', 'trie_cache'],
        highlightTip: 'Precomputing top 5 queries at each Trie node turns O(V + E) search into instantaneous O(1) fetch.'
      },
      {
        stepNumber: 3,
        title: 'Offline Trie Rebuilding',
        description: 'Real-time search logs write to Kafka. Aggregation pipeline computes weekly frequency counts and publishes updated snapshot to Trie servers.',
        activeNodeIds: ['agg_service', 'trie_cache'],
        highlightTip: 'Autocomplete popularity changes over days, not milliseconds. Update Trie via offline snapshots.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Trie Node Memory Optimization',
        content: 'To prevent memory bloat: 1. Limit max prefix search depth to 20 characters. 2. Store only top 5-10 precomputed suggestions per node. 3. Use compressed prefix trees (Radix Tree / Patricia Trie) to merge single-child node chains.'
      }
    ],
    tradeoffs: [
      {
        approachA: 'Traverse Entire Trie Subtree on Every Request',
        approachB: 'Precompute & Cache Top 5 Suggestions Inside Each Node',
        verdict: 'Precomputing inside nodes is mandatory to achieve sub-10ms response times.',
        prosA: ['Low memory footprint per node', 'Instant reflection of count changes'],
        prosB: ['O(p) ultra-fast response time regardless of subtree size', 'Zero sorting at query time'],
        whenToUse: 'Always precompute top-K in Trie nodes for autocomplete.'
      }
    ],
    keyTakeaways: [
      { title: 'Trie Prefix Traversal', description: 'Lookup time depends only on prefix length p (O(p)), not total dictionary size.' },
      { title: 'Client Debounce', description: 'Wait 100-200ms of user typing idle before issuing autocomplete request.' }
    ],
    hasInteractiveLab: true,
    labType: 'trie-autocomplete'
  },
  {
    id: 14,
    slug: 'youtube',
    number: '14',
    title: 'Design YouTube',
    category: 'Real-World Scale Systems',
    difficulty: 'Advanced',
    readTimeMin: 17,
    summary: 'Design video streaming at planet scale. Video uploading, Transcoding DAG pipelines, Adaptive Bitrate Streaming (HLS & MPEG-DASH), Blob storage, and CDN edge optimization.',
    problemStatement: 'Design a global video streaming platform like YouTube supporting 1B+ active users, 500 hours of video uploaded every minute, with seamless playback across diverse network speeds.',
    keyRequirements: {
      functional: ['Upload video files', 'Transcode into multiple resolutions (1080p, 720p, 480p, 360p) and bitrates', 'Stream video smoothly with adaptive quality', 'Track view counts and engagement'],
      nonFunctional: ['Instant streaming with low buffering time (< 1s)', 'High video storage durability (99.999999999%)', 'Cost-effective CDN edge bandwidth delivery']
    },
    intuition: {
      analogy: 'Imagine a water filtration plant. Raw water (massive raw 4K video) arrives in large tanker trucks. The plant filters and splits it into standard bottled containers (1080p, 720p, 480p) divided into 5-second drinkable cups (HLS video segments) stocked at local corner stores (CDN edges) near every customer.',
      whyNaiveFails: 'Streaming raw MP4 files from a centralized web server forces mobile users on slow 3G connections to buffer forever and causes colossal bandwidth bills.',
      coreInsight: 'Split videos into 5-10 second chunks (.ts / .m4s). Use Adaptive Bitrate Streaming (HLS / DASH) so video players dynamically switch quality on the fly based on current network bandwidth.'
    },
    architectureNodes: [
      { id: 'creator', label: 'Video Creator / Client', type: 'client', description: 'Uploads raw 4K video file', x: 50, y: 80 },
      { id: 'viewer', label: 'Video Viewer / App', type: 'client', description: 'Plays stream via HLS / DASH player', x: 50, y: 240 },
      { id: 'upload_svc', label: 'Upload API & Blob Storage', type: 'storage', description: 'S3-compatible temporary raw video bucket', x: 260, y: 80 },
      { id: 'transcode_dag', label: 'Transcoding DAG Pipeline', type: 'worker', description: 'Splits video into chunks and encodes to 1080p, 720p, 480p in parallel', x: 500, y: 80 },
      { id: 'blob_store', label: 'Transcoded Blob Store (S3)', type: 'storage', description: 'Stores chunked .ts files and .m3u8 master playlists', x: 740, y: 80 },
      { id: 'cdn', label: 'Global Video CDN', type: 'cdn', description: 'Edge nodes streaming video chunks with byte-range requests', x: 500, y: 240 },
      { id: 'meta_db', label: 'Video Metadata DB', type: 'database', description: 'Stores title, tags, upload status, view counts', x: 260, y: 240 }
    ],
    architectureEdges: [
      { from: 'creator', to: 'upload_svc', label: 'Multipart Upload', animated: true },
      { from: 'upload_svc', to: 'transcode_dag', label: 'Trigger Transcode Job' },
      { from: 'transcode_dag', to: 'blob_store', label: 'Save Chunks & Manifests' },
      { from: 'blob_store', to: 'cdn', label: 'CDN Origin Pull' },
      { from: 'viewer', to: 'meta_db', label: 'Get Video Manifest URL' },
      { from: 'viewer', to: 'cdn', label: 'Stream 1080p.m3u8', animated: true }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Resumable Multipart Upload',
        description: 'Client requests pre-signed URL from API. Uploads raw video in 8MB chunks. If network drops, only the failed chunk is retransmitted.',
        activeNodeIds: ['creator', 'upload_svc'],
        highlightTip: 'Pre-signed S3 URLs bypass web application servers, saving API server RAM.'
      },
      {
        stepNumber: 2,
        title: 'Directed Acyclic Graph (DAG) Transcoding',
        description: 'Transcoder splits video into 5-second segments. Parallel workers encode segments into H.264/AV1 formats across 4K, 1080p, 720p, 480p, and generate `.m3u8` master playlist.',
        activeNodeIds: ['transcode_dag', 'blob_store'],
        highlightTip: 'Shot-based encoding adjusts bitrate per scene (high bitrate for action scenes, low bitrate for static talking heads).'
      },
      {
        stepNumber: 3,
        title: 'Adaptive Bitrate Streaming (HLS)',
        description: 'Player downloads `master.m3u8`. If bandwidth is 15 Mbps, plays 1080p segments. If bandwidth drops to 2 Mbps, player automatically switches to 480p chunks without stopping playback.',
        activeNodeIds: ['viewer', 'cdn'],
        highlightTip: 'CDN edge caching absorbs 95%+ of video playback traffic.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Adaptive Bitrate (HLS Manifest Structure)',
        content: `Master Playlist (master.m3u8):
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
720p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=854x480
480p/index.m3u8

Each sub-playlist contains sequential 5-second video chunks (.ts or .m4s).`
      }
    ],
    tradeoffs: [
      {
        approachA: 'Direct Single File MP4 Streaming',
        approachB: 'Chunked Adaptive Bitrate Streaming (HLS / DASH)',
        verdict: 'HLS/DASH is essential for global mobile video delivery.',
        prosA: ['Simple file storage'],
        prosB: ['Zero buffering interruptions on network fluctuation', 'Starts playing within 500ms', 'Saves mobile user data'],
        whenToUse: 'Always use HLS/DASH for video streaming apps.'
      }
    ],
    keyTakeaways: [
      { title: 'DAG Transcoding Pipeline', description: 'Parallelize encoding by splitting raw video into small 5-second chunks.' },
      { title: 'Adaptive Bitrate Streaming (HLS)', description: 'Player dynamically switches quality based on client network bandwidth.' }
    ],
    hasInteractiveLab: false,
    labType: 'generic'
  },
  {
    id: 15,
    slug: 'google-drive',
    number: '15',
    title: 'Design Google Drive',
    category: 'Real-World Scale Systems',
    difficulty: 'Advanced',
    readTimeMin: 16,
    summary: 'Design Dropbox / Google Drive cloud storage. Block-level delta synchronization, Content-addressable storage (SHA-256 chunking), Metadata database, and Notification sync service.',
    problemStatement: 'Design a cloud file storage and synchronization service handling 50M DAU where files uploaded or edited on one device instantly sync to all other user devices with minimal network bandwidth.',
    keyRequirements: {
      functional: ['Upload, download, and sync files across devices', 'File revision history & conflict resolution', 'Instant change notifications on other logged-in devices'],
      nonFunctional: ['Bandwidth efficiency (delta sync only modified chunks)', 'High data durability (99.999999999%)', 'Fast sync latency (< 1s notification)']
    },
    intuition: {
      analogy: 'Imagine editing a 500-page book. Instead of mailing the entire 500-page physical book every time you fix a single typo on page 14, you only mail page 14. The receiver replaces page 14 in their local binder.',
      whyNaiveFails: 'Uploading entire large files (e.g. 2GB Photoshop files) whenever 1 byte changes wastes user bandwidth and chokes network pipes.',
      coreInsight: 'Block-Level Chunking & Delta Sync: Split files into 4MB blocks. Compute SHA-256 hash for each block. When a file is modified, upload ONLY the blocks whose cryptographic hash has changed.'
    },
    architectureNodes: [
      { id: 'clientA', label: 'Client Device A (Laptop)', type: 'client', description: 'Local block chunker & SQLite metadata cache', x: 50, y: 80 },
      { id: 'clientB', label: 'Client Device B (Mobile)', type: 'client', description: 'Receives instant sync notification', x: 50, y: 240 },
      { id: 'block_server', label: 'Block Server', type: 'service', description: 'Handles block uploads, deduplication & encryption', x: 300, y: 80 },
      { id: 's3_store', label: 'Object Store (S3 / GCS)', type: 'storage', description: 'Stores immutable encrypted 4MB file blocks', x: 550, y: 80 },
      { id: 'meta_db', label: 'Metadata DB (MySQL / Spanner)', type: 'database', description: 'Stores files, block lists, version history, user permissions', x: 550, y: 240 },
      { id: 'notif_svc', label: 'Notification Sync Service (WebSockets)', type: 'gateway', description: 'Long-lived connection notifying devices of file revisions', x: 300, y: 240 }
    ],
    architectureEdges: [
      { from: 'clientA', to: 'block_server', label: 'Upload Modified 4MB Block', animated: true },
      { from: 'block_server', to: 's3_store', label: 'Save Block' },
      { from: 'block_server', to: 'meta_db', label: 'Commit File Version' },
      { from: 'meta_db', to: 'notif_svc', label: 'Publish FileUpdatedEvent' },
      { from: 'notif_svc', to: 'clientB', label: 'Sync Event (WebSocket)', animated: true },
      { from: 'clientB', to: 'block_server', label: 'Download Changed Block' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Local Block Chunking & Hashing',
        description: 'Client splits file into 4MB chunks, computes SHA-256 for each. Queries server: `POST /blocks/check [hash1, hash2, hash3]`. Server replies: only `hash2` is missing.',
        activeNodeIds: ['clientA', 'block_server'],
        highlightTip: 'Deduplication saves massive cloud storage: if another user uploaded the same block, no upload is needed.'
      },
      {
        stepNumber: 2,
        title: 'Block Upload & Metadata Commit',
        description: 'Client uploads missing block to Block Server. Block is encrypted and saved to S3. New file version record is committed to Metadata DB.',
        activeNodeIds: ['block_server', 's3_store', 'meta_db'],
        highlightTip: 'Metadata DB records file recipe: File v2 = [BlockA, BlockB_modified, BlockC].'
      },
      {
        stepNumber: 3,
        title: 'Real-Time Sync Notification',
        description: 'Metadata DB triggers Notification Service. Notification service pushes WebSocket event to user’s other connected devices. Device B downloads only the modified block.',
        activeNodeIds: ['meta_db', 'notif_svc', 'clientB'],
        highlightTip: 'Delta sync reduces bandwidth consumption by 90%+ on typical document edits.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Conflict Resolution: Concurrent Editing',
        content: 'When two devices edit the same file offline and sync simultaneously: The first device to commit wins (creates v2). When the second device syncs, the server detects version conflict (expected v1 but found v2). The server saves the second edit as a separate conflicting copy (e.g. `document (John’s conflicted copy 2026-09-11).docx`).'
      }
    ],
    tradeoffs: [
      {
        approachA: 'Full File Sync',
        approachB: 'Block-Level Delta Sync',
        verdict: 'Block-level delta sync is the foundation of Dropbox and Google Drive.',
        prosA: ['Simple file upload/download'],
        prosB: ['Massive bandwidth savings', 'Fast synchronization', 'Automatic cloud-wide deduplication'],
        whenToUse: 'Block-level chunking for cloud drive sync applications.'
      }
    ],
    keyTakeaways: [
      { title: 'Block Chunking (4MB)', description: 'Compute cryptographic hashes to sync only modified blocks.' },
      { title: 'Cross-Device Notification', description: 'Use WebSockets to alert other devices to pull only new blocks.' }
    ],
    hasInteractiveLab: false,
    labType: 'generic'
  },
  {
    id: 16,
    slug: 'proximity-service',
    number: '16',
    title: 'Proximity Service',
    category: 'Real-World Scale Systems',
    difficulty: 'Intermediate',
    readTimeMin: 14,
    summary: 'Design Yelp / Google Places. Spatial indexing, Geohash, Quadtree, Google S2 geometry, and fast geospatial range queries for nearby restaurants and venues.',
    problemStatement: 'Design a proximity service supporting 100M search queries/day where users can search for nearby places (e.g. restaurants within 5km) with sub-50ms latency.',
    keyRequirements: {
      functional: ['Add/update/delete place locations and metadata', 'Search top places within a given radius (e.g. 5km) or bounding box', 'Display place details, reviews, and photos'],
      nonFunctional: ['Sub-50ms search latency', 'Highly read-heavy system (100:1 read to write ratio)', 'Scalable spatial index']
    },
    intuition: {
      analogy: 'Finding a house on a map. Instead of scanning every single street in the entire country, you first look at the state, then city, then zip code grid box.',
      whyNaiveFails: 'Executing SQL queries with `WHERE (lat - my_lat)^2 + (lng - my_lng)^2 < R^2` performs full table scans across millions of coordinates because 2D coordinates cannot be indexed on standard 1D B-Trees.',
      coreInsight: 'Geospatial Indexing via Geohash or Quadtrees. Geohash converts 2D (lat, lng) coordinates into a 1D alphanumeric string where common prefixes represent geographic proximity.'
    },
    architectureNodes: [
      { id: 'user', label: 'User Mobile App', type: 'client', description: 'Search: "Coffee near me" (lat, lng, radius=2km)', x: 50, y: 150 },
      { id: 'lb', label: 'Load Balancer', type: 'gateway', description: 'Distributes location queries', x: 240, y: 150 },
      { id: 'prox_svc', label: 'Proximity Search Service', type: 'service', description: 'Converts lat/lng to Geohash & queries 9 neighbor bounding boxes', x: 450, y: 150 },
      { id: 'geo_cache', label: 'Geohash Redis Cache', type: 'cache', description: 'Stores geohash_prefix -> List<PlaceID>', x: 680, y: 80 },
      { id: 'place_db', label: 'Place Metadata DB (Read Replicas)', type: 'database', description: 'Stores name, address, rating, photos', x: 680, y: 220 }
    ],
    architectureEdges: [
      { from: 'user', to: 'lb', label: 'GET /v1/places/search', animated: true },
      { from: 'lb', to: 'prox_svc', label: 'Forward Query' },
      { from: 'prox_svc', to: 'geo_cache', label: '1. Lookup Geohash & 8 Neighbors' },
      { from: 'prox_svc', to: 'place_db', label: '2. Hydrate Place Details (MGET)' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Geohash Computation',
        description: 'Service receives user lat=37.7749, lng=-122.4194. Computes 6-character Geohash: `9q8yyk` (representing a bounding box of ~1.2km x 0.6km).',
        activeNodeIds: ['user', 'prox_svc'],
        highlightTip: 'Geohash length determines grid precision (6 chars ≈ 1.2km; 5 chars ≈ 4.9km).'
      },
      {
        stepNumber: 2,
        title: 'Querying 8 Neighboring Cells',
        description: 'To solve edge boundary issues (places right across grid lines), the service queries the target cell PLUS its 8 adjacent neighbor geohash cells in parallel.',
        activeNodeIds: ['prox_svc', 'geo_cache'],
        highlightTip: 'Querying 9 cells guarantees no nearby venue is missed near cell edges.'
      },
      {
        stepNumber: 3,
        title: 'Hydration & Distance Sorting',
        description: 'Service retrieves place IDs from Redis cache, calculates exact Haversine distance, filters within exact radius, and hydrates place metadata.',
        activeNodeIds: ['prox_svc', 'place_db'],
        highlightTip: 'Read-heavy places data is cached aggressively since restaurant coordinates rarely change.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Geohash vs Quadtree vs Google S2',
        content: '• **Geohash**: Encodes 2D coordinates into base32 string. Great for simple Redis key-value caching (`geohash:9q8yyk -> [id1, id2]`).\n• **Quadtree**: Hierarchical in-memory tree where each node splits into 4 quadrants when place density exceeds threshold (e.g. 100 places). Ideal for dense cities.\n• **Google S2**: Projects Earth onto a cube with Hilbert space-filling curve. Excellent for arbitrary polygons and spatial joins.'
      }
    ],
    tradeoffs: [
      {
        approachA: 'Relational DB Geospatial (PostGIS)',
        approachB: 'In-Memory Geohash Redis Cache',
        verdict: 'In-Memory Geohash caching is necessary for 50k+ read QPS with sub-20ms latency.',
        prosA: ['Standard SQL queries', 'Rich spatial geometry functions'],
        prosB: ['Sub-5ms memory lookups', 'Simple horizontal sharding by geohash prefix'],
        whenToUse: 'PostGIS for complex polygon queries; Geohash Redis for high-scale mobile search.'
      }
    ],
    keyTakeaways: [
      { title: 'Geohash Prefix Matching', description: 'Nearby locations share matching string prefix prefixes.' },
      { title: 'Always Query 8 Neighbors', description: 'Prevents missing places that sit right across grid borders.' }
    ],
    hasInteractiveLab: false,
    labType: 'generic'
  },
  {
    id: 17,
    slug: 'nearby-friends',
    number: '17',
    title: 'Nearby Friends',
    category: 'Real-World Scale Systems',
    difficulty: 'Advanced',
    readTimeMin: 15,
    summary: 'Design real-time location sharing (Find My, Snapchat Snap Map). WebSocket connection managers, Redis Pub/Sub channels, Location cache, and Geohash clustering.',
    problemStatement: 'Design a real-time location tracking service where users discover friends within a 5km radius with location updates every 30 seconds for 10M concurrent users.',
    keyRequirements: {
      functional: ['Broadcast user location updates to mutual friends within 5km radius', 'Real-time proximity alerts when a friend enters radius', 'User privacy controls & location sharing toggle'],
      nonFunctional: ['Low latency (< 2s location update delay)', 'Battery efficiency on mobile devices', 'Scalable to 10M active connections with 30s update interval']
    },
    intuition: {
      analogy: 'A private walkie-talkie channel for every friend group. Whenever you move, your walkie-talkie broadcasts your coordinates to friends tuned to your channel.',
      whyNaiveFails: 'Querying a central database every 30 seconds for 10M users generates 330,000 QPS of geospatial proximity calculations, melting any database.',
      coreInsight: 'Redis Pub/Sub Architecture: Every user has a dedicated Pub/Sub channel. When User A moves, they publish coordinates to their own channel. Only mutual friends subscribed to User A receive the update.'
    },
    architectureNodes: [
      { id: 'userA', label: 'User A (Moving)', type: 'client', description: 'Sends (lat, lng) every 30 seconds', x: 50, y: 80 },
      { id: 'userB', label: 'Friend B (Observing)', type: 'client', description: 'Receives real-time map pin update', x: 50, y: 240 },
      { id: 'ws_server', label: 'WebSocket Server Fleet', type: 'gateway', description: 'Maintains open connections to active mobile clients', x: 280, y: 150 },
      { id: 'loc_cache', label: 'Location Cache (Redis TTL)', type: 'cache', description: 'Stores user_id -> {lat, lng, timestamp} (TTL: 60s)', x: 520, y: 80 },
      { id: 'pubsub_redis', label: 'Redis Pub/Sub Cluster', type: 'queue', description: 'Channel per user: friends subscribe to each other’s channels', x: 520, y: 220 }
    ],
    architectureEdges: [
      { from: 'userA', to: 'ws_server', label: 'Location Ping (30s)', animated: true },
      { from: 'ws_server', to: 'loc_cache', label: 'Update Location' },
      { from: 'ws_server', to: 'pubsub_redis', label: 'PUBLISH userA_channel' },
      { from: 'pubsub_redis', to: 'ws_server', label: 'SUBSCRIBE userA_channel' },
      { from: 'ws_server', to: 'userB', label: 'Push Pin Update (WebSocket)', animated: true }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Periodic Location Ping',
        description: 'User A’s phone sends `(lat, lng)` over open WebSocket to WebSocket Server. Server writes coordinates to Redis Location Cache with a 60s expiration TTL.',
        activeNodeIds: ['userA', 'ws_server', 'loc_cache'],
        highlightTip: 'TTL automatically purges inactive or offline users from memory.'
      },
      {
        stepNumber: 2,
        title: 'Redis Pub/Sub Broadcast',
        description: 'WebSocket Server publishes update to User A’s Redis Pub/Sub channel (`user:101:location`).',
        activeNodeIds: ['ws_server', 'pubsub_redis'],
        highlightTip: 'Pub/Sub routes messages in memory in under 1ms.'
      },
      {
        stepNumber: 3,
        title: 'Distance Calculation & Push',
        description: 'WebSocket Server hosting Friend B receives the Pub/Sub event, checks if distance is <= 5km. If inside radius, pushes updated pin to Friend B’s screen.',
        activeNodeIds: ['pubsub_redis', 'ws_server', 'userB'],
        highlightTip: 'Filtering distance on the subscriber server avoids unnecessary mobile battery drain.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Scaling Redis Pub/Sub to 10M Concurrent Users',
        content: '10M users with an average of 50 online friends means 500M subscriptions. Shard Redis Pub/Sub servers based on `channel_id = hash(user_id) % N`. Consistent hashing allows seamless scaling of Pub/Sub nodes.'
      }
    ],
    tradeoffs: [
      {
        approachA: 'Full Proximity Search on Every Ping',
        approachB: 'Redis Pub/Sub Friend Channels + Local Distance Check',
        verdict: 'Pub/Sub channels drastically reduce compute from O(N^2) to O(Friends).',
        prosA: ['Discovers non-friend nearby users'],
        prosB: ['Only computes distance between mutual friends', 'Ultra-low CPU overhead', 'Linear horizontal scaling'],
        whenToUse: 'Pub/Sub for friend tracking; Geohash search for public strangers.'
      }
    ],
    keyTakeaways: [
      { title: 'Publish to Own Channel', description: 'Friends subscribe only to their active friends’ channels.' },
      { title: 'Redis TTL Expiry', description: 'Automatically drops stale locations when a user disconnects.' }
    ],
    hasInteractiveLab: false,
    labType: 'generic'
  },
  {
    id: 18,
    slug: 'google-maps',
    number: '18',
    title: 'Design Google Maps',
    category: 'Real-World Scale Systems',
    difficulty: 'Advanced',
    readTimeMin: 17,
    summary: 'Design navigation at planetary scale. Map tile systems, Geocoding, Pathfinding (A* & Contraction Hierarchies / Dijkstra), and live traffic integration.',
    problemStatement: 'Design a global mapping and turn-by-turn navigation system for 1 Billion DAU supporting location search, map tile rendering, and real-time fastest route calculation.',
    keyRequirements: {
      functional: ['Render map tiles smoothly at different zoom levels', 'Geocoding (convert addresses to lat/lng coordinates)', 'Calculate fastest driving route with live traffic avoidance'],
      nonFunctional: ['Sub-second route calculation', 'P99 Map tile loading < 50ms', 'High availability and offline tile caching']
    },
    intuition: {
      analogy: 'Imagine zoom levels as paper atlas books. At world level, you have 1 page. At city level, you divide the city into a grid of 256x256 pixel tiles. When navigating, you do not check every residential driveway—you take highways (Contraction Hierarchies) until you exit near the destination.',
      whyNaiveFails: 'Running Dijkstra’s shortest path algorithm over the entire world’s road network on every search takes minutes of CPU time per request.',
      coreInsight: 'Map Tile Pyramid (Slippy Map) for visual rendering + Contraction Hierarchies (hierarchical road graphs precomputing highway shortcuts) for millisecond pathfinding.'
    },
    architectureNodes: [
      { id: 'user', label: 'Driver / Navigation App', type: 'client', description: 'Requests route: Home -> Airport', x: 50, y: 150 },
      { id: 'lb', label: 'Load Balancer', type: 'gateway', description: 'Layer 7 API Gateway', x: 240, y: 150 },
      { id: 'tile_cdn', label: 'Map Tile CDN', type: 'cdn', description: 'Caches pre-rendered 256x256 raster/vector map tiles', x: 460, y: 60 },
      { id: 'routing_svc', label: 'Routing Engine (Contraction Hierarchies)', type: 'service', description: 'Fast graph pathfinding with real-time traffic edge weights', x: 460, y: 180 },
      { id: 'traffic_svc', label: 'Live Traffic Aggregator', type: 'worker', description: 'Processes real-time driver GPS telemetry to update road speeds', x: 720, y: 180 },
      { id: 'road_db', label: 'Road Network Graph DB', type: 'database', description: 'Stores road intersections (nodes) and street segments (edges)', x: 720, y: 300 }
    ],
    architectureEdges: [
      { from: 'user', to: 'tile_cdn', label: 'Fetch Map Tiles (z/x/y)', animated: true },
      { from: 'user', to: 'lb', label: 'GET /v1/directions', animated: true },
      { from: 'lb', to: 'routing_svc', label: 'Find Fastest Path' },
      { from: 'traffic_svc', to: 'routing_svc', label: 'Stream Traffic Speeds (Kafka)' },
      { from: 'routing_svc', to: 'road_db', label: 'Query Road Graph' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Map Tile Rendering (Tile Pyramid)',
        description: 'Map is divided into 256x256 pixel tiles indexed by `zoom/x/y`. Client downloads vector tiles from CDN edge with aggressive browser caching.',
        activeNodeIds: ['user', 'tile_cdn'],
        highlightTip: 'Vector tiles allow client-side GPU rendering, 3D building rotation, and dynamic daylight themes.'
      },
      {
        stepNumber: 2,
        title: 'Route Calculation via Contraction Hierarchies',
        description: 'Routing engine converts start and end points into graph nodes. It searches up the highway hierarchy from both ends, finding the optimal path in < 10ms.',
        activeNodeIds: ['lb', 'routing_svc', 'road_db'],
        highlightTip: 'Contraction hierarchies precompute shortcut edges across major arterials and freeways.'
      },
      {
        stepNumber: 3,
        title: 'Live Traffic Rerouting',
        description: 'Traffic service processes GPS speed pings from active drivers, dynamically adjusting road edge weights and triggering reroutes if accidents occur.',
        activeNodeIds: ['traffic_svc', 'routing_svc', 'user'],
        highlightTip: 'Streaming speed updates via Kafka allows adaptive ETA recalibration.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Contraction Hierarchies Pathfinding Algorithm',
        content: 'Standard Dijkstra takes O(|E| + |V| log |V|) — iterating millions of nodes across a continent. Contraction Hierarchies rank road importance (Local roads -> Avenues -> Highways). Queries run Bidirectional Dijkstra only searching upward toward highways, reducing search space from millions of nodes to just a few hundred.'
      }
    ],
    tradeoffs: [
      {
        approachA: 'Raw Dijkstra on Flat Road Graph',
        approachB: 'Contraction Hierarchies with Multi-Level Graphs',
        verdict: 'Contraction Hierarchies provide 1000x faster pathfinding queries.',
        prosA: ['Always finds exact theoretical minimum without precomputation'],
        prosB: ['Sub-10ms route calculation across continents', 'Low server CPU footprint'],
        whenToUse: 'Contraction Hierarchies for real-time turn-by-turn navigation.'
      }
    ],
    keyTakeaways: [
      { title: 'Tile Pyramid (z/x/y)', description: 'Pre-rendered vector tiles cached at CDN edge.' },
      { title: 'Contraction Hierarchies', description: 'Precomputed highway shortcuts enable sub-10ms continental routing.' }
    ],
    hasInteractiveLab: false,
    labType: 'generic'
  },
  {
    id: 19,
    slug: 'distributed-message-queue',
    number: '19',
    title: 'Distributed Message Queue',
    category: 'Advanced Infrastructure',
    difficulty: 'Advanced',
    readTimeMin: 18,
    summary: 'Design Apache Kafka / RabbitMQ. Message broker architecture, Partitioning, Consumer Groups, Zero-Copy OS disk transfer (sendfile), Replication, and Exactly-Once semantics.',
    problemStatement: 'Design a distributed, high-throughput append-only message queue supporting millions of messages/sec with consumer group load balancing and zero data loss.',
    keyRequirements: {
      functional: ['Publish and consume messages across partitioned topics', 'Consumer groups with automatic partition rebalancing', 'Configurable message retention and replayability'],
      nonFunctional: ['Ultra-high throughput (> 1M msgs/sec)', 'Sub-10ms latency with zero-copy I/O', 'High durability with ISR (In-Sync Replicas)']
    },
    intuition: {
      analogy: 'A bank with multiple teller lines (partitions). Customers (producers) take a ticket. Multiple tellers in a team (consumer group) each handle one line exclusively, ensuring no customer is served twice and no lines collide.',
      whyNaiveFails: 'Traditional message queues storing messages in relational databases or complex memory trees suffer from heavy lock contention, random disk I/O, and consumer head-of-line blocking.',
      coreInsight: 'Append-Only Commit Log on disk + OS PageCache + Linux Zero-Copy `sendfile()`. By avoiding JVM user-space memory copies and utilizing sequential disk writes, Kafka achieves multi-gigabit throughput.'
    },
    architectureNodes: [
      { id: 'producer', label: 'Producers (App Servers)', type: 'client', description: 'Publishes messages to Topic partitions', x: 50, y: 150 },
      { id: 'broker1', label: 'Kafka Broker 1 (Leader P0)', type: 'service', description: 'Append-only commit log partition 0', x: 350, y: 80 },
      { id: 'broker2', label: 'Kafka Broker 2 (Leader P1)', type: 'service', description: 'Append-only commit log partition 1', x: 350, y: 220 },
      { id: 'isr', label: 'Follower Replicas (ISR)', type: 'database', description: 'In-Sync Replicas syncing leader commit log', x: 600, y: 150 },
      { id: 'consumer_grp', label: 'Consumer Group (Workers)', type: 'worker', description: 'Workers consuming assigned partitions exclusively', x: 820, y: 150 }
    ],
    architectureEdges: [
      { from: 'producer', to: 'broker1', label: 'Publish to P0 (hash(key))', animated: true },
      { from: 'producer', to: 'broker2', label: 'Publish to P1', animated: true },
      { from: 'broker1', to: 'isr', label: 'Replication sync' },
      { from: 'broker1', to: 'consumer_grp', label: 'Zero-Copy Poll (P0)', animated: true },
      { from: 'broker2', to: 'consumer_grp', label: 'Zero-Copy Poll (P1)', animated: true }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Partition Key Routing & Sequential Write',
        description: 'Producer computes `hash(key) % num_partitions` and sends batch to Broker 1. Broker appends message sequentially to the end of partition commit log on disk.',
        activeNodeIds: ['producer', 'broker1'],
        highlightTip: 'Sequential disk I/O on modern NVMe SSDs reaches speeds comparable to RAM (up to 3 GB/s).'
      },
      {
        stepNumber: 2,
        title: 'In-Sync Replica (ISR) Ack',
        description: 'Follower brokers pull the new log segment. Once all replicas in the ISR list acknowledge, leader sends ACK to producer.',
        activeNodeIds: ['broker1', 'isr'],
        highlightTip: '`acks=all` guarantees zero data loss even if the leader broker dies immediately.'
      },
      {
        stepNumber: 3,
        title: 'Zero-Copy Consumer Delivery',
        description: 'Consumer polls partition. Broker uses Linux `sendfile()` system call to transfer bytes directly from OS PageCache to Network Socket without copying into application memory.',
        activeNodeIds: ['broker1', 'consumer_grp'],
        highlightTip: 'Zero-copy avoids CPU context switches and memory copying overhead.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Zero-Copy (Linux sendfile() System Call)',
        content: 'Traditional Read/Write: Disk -> OS Page Cache -> Application User Memory -> Socket Buffer -> NIC Buffer (4 context switches, 3 memory copies).\n\nZero-Copy (`sendfile`): Disk -> OS Page Cache -> Direct DMA Transfer to Network Interface Card (2 context switches, 0 CPU memory copies).'
      }
    ],
    tradeoffs: [
      {
        approachA: 'Traditional In-Memory Queue (RabbitMQ)',
        approachB: 'Distributed Append-Only Commit Log (Kafka)',
        verdict: 'Kafka commit logs support massive throughput, horizontal partition scaling, and log replay.',
        prosA: ['Complex routing (topic exchanges)', 'Per-message acknowledgement'],
        prosB: ['Millions of msgs/sec throughput', 'Replayable history', 'Zero-copy disk efficiency'],
        whenToUse: 'Kafka for high-volume event streams; RabbitMQ for complex transactional job routing.'
      }
    ],
    keyTakeaways: [
      { title: 'Sequential Append-Only Log', description: 'Eliminates random disk seeks for maximum IOPS.' },
      { title: 'Zero-Copy OS Transfer', description: 'Direct DMA from PageCache to network socket.' }
    ],
    hasInteractiveLab: false,
    labType: 'generic'
  },
  {
    id: 20,
    slug: 'metrics-monitoring',
    number: '20',
    title: 'Metrics Monitoring and Alerting System',
    category: 'Advanced Infrastructure',
    difficulty: 'Advanced',
    readTimeMin: 15,
    summary: 'Design Prometheus / Datadog. Push vs Pull data collection, Time-Series Databases (TSDB), Inverted index for metric labels, Downsampling, and Alert evaluation.',
    problemStatement: 'Design a distributed telemetry metrics collection and alerting infrastructure handling 10M metric writes/second, 100k queries/sec, and real-time alert firing.',
    keyRequirements: {
      functional: ['Collect infrastructure and business metrics (CPU, memory, QPS, latency)', 'Query metrics with aggregation functions (e.g. rate, avg, p99)', 'Evaluate alerting rules and dispatch to PagerDuty/Slack'],
      nonFunctional: ['Sub-second alert notification latency', 'Long-term metric retention via downsampling', 'Metrics system must be resilient when monitored systems fail']
    },
    intuition: {
      analogy: 'A hospital ICU patient monitor. Every second, sensors record heart rate and oxygen. If vitals drop below threshold for 3 consecutive seconds, alarms ring instantly, while historical trends are compressed into 24-hour charts.',
      whyNaiveFails: 'Storing billions of high-frequency data points in standard relational databases causes table bloat, slow range queries, and catastrophic disk consumption.',
      coreInsight: 'Time-Series Database (TSDB) with Gorilla Compression + Inverted Label Index + Downsampling Rollups. Gorilla compression compresses time-series delta timestamps and float values by over 90% in RAM.'
    },
    architectureNodes: [
      { id: 'servers', label: 'Monitored Microservices', type: 'client', description: 'Emits metrics: http_requests_total{status="500"}', x: 50, y: 150 },
      { id: 'collector', label: 'Metrics Collector / Scraper', type: 'service', description: 'Prometheus pull worker / OpenTelemetry agent', x: 280, y: 150 },
      { id: 'tsdb', label: 'Time-Series DB (Prometheus/Influx)', type: 'database', description: 'Gorilla compressed in-memory chunks + SSTable disk blocks', x: 520, y: 80 },
      { id: 'alert_engine', label: 'Alert Manager', type: 'service', description: 'Evaluates PromQL alert rules (e.g. error_rate > 5% for 2m)', x: 520, y: 220 },
      { id: 'pagerduty', label: 'PagerDuty / Slack / Grafana', type: 'storage', description: 'Notification targets & visualization dashboards', x: 780, y: 150 }
    ],
    architectureEdges: [
      { from: 'servers', to: 'collector', label: 'Pull / Push Telemetry', animated: true },
      { from: 'collector', to: 'tsdb', label: 'Write Time-Series Data' },
      { from: 'tsdb', to: 'alert_engine', label: 'Evaluate Rules' },
      { from: 'alert_engine', to: 'pagerduty', label: 'Trigger Incident Alert' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Metric Scraping & Buffering',
        description: 'Collector periodically scrapes `/metrics` endpoints across service discovery targets every 15 seconds.',
        activeNodeIds: ['servers', 'collector'],
        highlightTip: 'Pull model prevents server overload because collectors control the scrape frequency.'
      },
      {
        stepNumber: 2,
        title: 'TSDB Ingestion & Gorilla Compression',
        description: 'TSDB stores timestamps using double-delta compression and float values using XOR floating-point compression, reducing 16 bytes per point to ~1.37 bytes.',
        activeNodeIds: ['collector', 'tsdb'],
        highlightTip: 'Gorilla compression yields over 10x RAM savings for time-series data.'
      },
      {
        stepNumber: 3,
        title: 'Alert Rule Evaluation',
        description: 'Alert Manager evaluates queries: `sum(rate(errors[2m])) / sum(rate(requests[2m])) > 0.05`. If condition remains true for `for: 5m`, fires high-priority alert to PagerDuty.',
        activeNodeIds: ['tsdb', 'alert_engine', 'pagerduty'],
        highlightTip: 'Alert debouncing and deduplication prevent alert fatigue during mass outages.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Push vs Pull Architecture: The Great Debate',
        content: '• **Pull Model (Prometheus)**: Collector pulls metrics from `/metrics`. Auto-detects target health (if scrape fails, target is down). Collector cannot be overwhelmed by sudden microservice spikes.\n• **Push Model (StatsD, CloudWatch)**: Applications push metrics to gateway. Better for short-lived ephemeral batch jobs and serverless functions (AWS Lambda).'
      }
    ],
    tradeoffs: [
      {
        approachA: 'Pull Model (Prometheus)',
        approachB: 'Push Model (StatsD / AWS CloudWatch)',
        verdict: 'Pull is standard for long-running containerized infrastructure; Push for ephemeral serverless Lambdas.',
        prosA: ['Centralized scrape rate control', 'Built-in node liveness detection'],
        prosB: ['Works behind strict NAT/firewalls', 'Supports short-lived serverless jobs'],
        whenToUse: 'Prometheus Pull for Kubernetes services; Push gateway for AWS Lambda.'
      }
    ],
    keyTakeaways: [
      { title: 'Gorilla Compression', description: 'XOR delta encoding shrinks metric data by 90% in RAM.' },
      { title: 'Downsampling Rollups', description: 'Roll up 1-second raw metrics to 1-minute averages after 7 days to save disk.' }
    ],
    hasInteractiveLab: false,
    labType: 'generic'
  },
  {
    id: 21,
    slug: 'ad-click-event-aggregation',
    number: '21',
    title: 'Ad Click Event Aggregation',
    category: 'Advanced Infrastructure',
    difficulty: 'Advanced',
    readTimeMin: 16,
    summary: 'Design real-time advertising analytics like Google Ads / Meta Ads. Stream processing with Apache Flink, Tumbling vs Sliding windows, Watermarking, and Exactly-Once reconciliation.',
    problemStatement: 'Design an ad click aggregation pipeline processing 10 Billion ad clicks per day (100k clicks/sec) to compute real-time advertiser billing and CTR analytics in < 1 second.',
    keyRequirements: {
      functional: ['Aggregate ad clicks by ad_id in 1-minute and 1-hour windows', 'Filter fraudulent duplicate clicks (bot mitigation)', 'Provide query API for advertiser dashboards'],
      nonFunctional: ['Exactly-once processing (critical for billing money)', 'Fault-tolerant stream recovery with checkpoints', 'Handle late-arriving events due to network lag']
    },
    intuition: {
      analogy: 'A coin sorting counter at a bank. As coins fall through the slot, they roll into designated columns (1-minute tumbling windows). If a coin arrives slightly late, the machine uses a grace period (watermark) before finalizing the batch total.',
      whyNaiveFails: 'Batch processing with MapReduce or SQL `GROUP BY` introduces 1-hour reporting delays. Direct atomic increment in databases causes massive lock contention at 100k writes/sec.',
      coreInsight: 'Stream Processing with Apache Flink / Spark Streaming + Kafka. Aggregate clicks in in-memory tumbling time windows with watermarking for late events, and commit results with two-phase commit (2PC) for exactly-once guarantees.'
    },
    architectureNodes: [
      { id: 'user', label: 'User Clicking Ad', type: 'client', description: 'Click redirect: /click?ad_id=9812&user_id=4', x: 50, y: 150 },
      { id: 'click_svc', label: 'Ad Click Ingestion API', type: 'gateway', description: 'Appends raw click event with timestamp to Kafka', x: 260, y: 150 },
      { id: 'kafka', label: 'Kafka Raw Clicks Topic', type: 'queue', description: 'Partitioned by ad_id for ordered stream delivery', x: 480, y: 150 },
      { id: 'flink', label: 'Apache Flink Stream Processor', type: 'worker', description: 'Tumbling 1-minute window aggregator with watermarking', x: 700, y: 80 },
      { id: 'olap_db', label: 'OLAP DB (ClickHouse / Pinot)', type: 'database', description: 'Stores aggregated metrics: { ad_id, minute, click_count }', x: 700, y: 240 }
    ],
    architectureEdges: [
      { from: 'user', to: 'click_svc', label: 'Click Event', animated: true },
      { from: 'click_svc', to: 'kafka', label: 'Produce Event' },
      { from: 'kafka', to: 'flink', label: 'Consume Stream', animated: true },
      { from: 'flink', to: 'olap_db', label: 'Write 1-Min Aggregates' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Click Ingestion & Fast Logging',
        description: 'Client clicks ad. Ingestion service immediately logs event to Kafka partitioned by `ad_id` and redirects user to landing page in < 20ms.',
        activeNodeIds: ['user', 'click_svc', 'kafka'],
        highlightTip: 'Partitioning Kafka by ad_id ensures all clicks for the same ad land on the same Flink worker node.'
      },
      {
        stepNumber: 2,
        title: 'Stream Aggregation (1-Minute Tumbling Window)',
        description: 'Flink buffers events into 1-minute buckets `[12:01:00 - 12:02:00]`. Watermark allows up to 15 seconds for late-arriving mobile clicks before closing window.',
        activeNodeIds: ['kafka', 'flink'],
        highlightTip: 'Watermarks balance real-time responsiveness with handling out-of-order data.'
      },
      {
        stepNumber: 3,
        title: 'OLAP Storage & Advertiser Dashboard',
        description: 'Aggregated sums write to ClickHouse / Apache Pinot. Advertisers query real-time CTR and ad spend with sub-second analytical queries.',
        activeNodeIds: ['flink', 'olap_db'],
        highlightTip: 'ClickHouse column-oriented storage runs aggregations across billions of rows in milliseconds.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Windowing Strategies: Tumbling vs Sliding vs Session',
        content: '• **Tumbling Window**: Fixed, non-overlapping time chunks (e.g. 12:00-12:01, 12:01-12:02). Perfect for financial billing.\n• **Sliding Window**: Overlapping time chunks evaluated periodically (e.g. last 5 minutes evaluated every 10 seconds). Ideal for trend detection.\n• **Session Window**: Groups events based on periods of user activity separated by idle gaps.'
      }
    ],
    tradeoffs: [
      {
        approachA: 'Raw Click Batch Aggregation in DB',
        approachB: 'Stream Processing Window Aggregation (Flink + Kafka)',
        verdict: 'Stream processing scales linearly to millions of events per second with sub-second latency.',
        prosA: ['Simple SQL setup'],
        prosB: ['Zero database lock contention', 'Sub-second real-time analytics', 'Handles out-of-order data with watermarks'],
        whenToUse: 'Stream processing for high-volume telemetry and ad clicks.'
      }
    ],
    keyTakeaways: [
      { title: 'Tumbling Windows for Billing', description: 'Non-overlapping time windows guarantee clean financial reconciliation.' },
      { title: 'Watermarking for Late Events', description: 'Tolerates mobile network delays without stalling the pipeline.' }
    ],
    hasInteractiveLab: false,
    labType: 'generic'
  },
  {
    id: 22,
    slug: 'hotel-reservation-system',
    number: '22',
    title: 'Hotel Reservation System',
    category: 'Real-World Scale Systems',
    difficulty: 'Advanced',
    readTimeMin: 16,
    summary: 'Design Booking.com / Airbnb. Concurrency control, Overbooking mitigation, Pessimistic vs Optimistic locking, Distributed transactions, and Idempotent payment reservation.',
    problemStatement: 'Design a hotel room reservation system handling 100k hotels and 5M rooms worldwide with zero double-booking, high query performance, and 10% controlled overbooking buffer.',
    keyRequirements: {
      functional: ['Search available rooms by date range and city', 'Reserve and hold room for 10 minutes during payment checkout', 'Prevent double-booking of the same room on overlapping dates'],
      nonFunctional: ['Strict data consistency (ACID) for reservations', 'High read throughput for hotel search queries', 'P99 reservation API latency < 200ms']
    },
    intuition: {
      analogy: 'A concert ticket counter with a 10-minute shopping cart timer. When you select seat 4B, the system locks that seat temporarily so no other buyer can grab it while you pull out your credit card.',
      whyNaiveFails: 'If two users click "Book Room" at the exact same millisecond, a standard `SELECT availability ... INSERT reservation` causes a race condition leading to catastrophic double-booking.',
      coreInsight: 'Relational Database Row-Level Locking / Optimistic Concurrency Control (OCC) with versioning or Redis Distributed Locks + TTL cart reservation.'
    },
    architectureNodes: [
      { id: 'user', label: 'Guest Booking Room', type: 'client', description: 'Selects room for July 10 - July 15', x: 50, y: 150 },
      { id: 'gateway', label: 'API Gateway', type: 'gateway', description: 'Applies rate limits & auth', x: 260, y: 150 },
      { id: 'reserve_svc', label: 'Reservation Service', type: 'service', description: 'Handles reservation transaction & cart hold timer', x: 480, y: 150 },
      { id: 'redis_lock', label: 'Redis Cart Lock (TTL: 10m)', type: 'cache', description: 'Temporary room hold lock: room_101:2026-07-10', x: 720, y: 80 },
      { id: 'hotel_db', label: 'Relational DB (ACID)', type: 'database', description: 'room_inventory table with date-range unique constraints', x: 720, y: 220 }
    ],
    architectureEdges: [
      { from: 'user', to: 'gateway', label: 'POST /v1/reservations', animated: true },
      { from: 'gateway', to: 'reserve_svc', label: 'Process Booking' },
      { from: 'reserve_svc', to: 'redis_lock', label: '1. Acquire 10-Min Hold' },
      { from: 'reserve_svc', to: 'hotel_db', label: '2. Commit Transaction (SQL)', animated: true }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Room Search (Cache-Aside Read)',
        description: 'User searches hotels in Paris for 5 nights. Proximity search queries Redis cache for precomputed room availability counters.',
        activeNodeIds: ['user', 'gateway'],
        highlightTip: 'Availability is checked at the room type level (e.g. Deluxe Suite: 4 available) rather than specific room numbers.'
      },
      {
        stepNumber: 2,
        title: 'Temporary Room Hold (10-Minute Cart Timer)',
        description: 'User clicks Book. Service acquires temporary hold in Redis (`SET lock:room_type_10:date "user_99" EX 600 NX`). Decrements available inventory.',
        activeNodeIds: ['reserve_svc', 'redis_lock'],
        highlightTip: 'If user abandons payment, Redis TTL key expires and room automatically returns to available pool.'
      },
      {
        stepNumber: 3,
        title: 'ACID Payment & Confirmation Commit',
        description: 'Payment succeeds. Service commits SQL transaction updating `room_inventory` and inserting `reservations` record inside a single serializable transaction.',
        activeNodeIds: ['reserve_svc', 'hotel_db'],
        highlightTip: 'Database isolation prevents double-booking at the physical storage layer.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Pessimistic vs Optimistic Locking for Bookings',
        content: '• **Pessimistic Locking (`SELECT FOR UPDATE`)**: Locks the database row immediately. Safe, but locks out concurrent readers and degrades throughput.\n• **Optimistic Locking (Version Column)**: `UPDATE room_inventory SET total_reserved = total_reserved + 1, version = version + 1 WHERE room_type_id = ? AND version = ?`. If version changed, transaction rolls back and retries.'
      }
    ],
    tradeoffs: [
      {
        approachA: 'Pessimistic Locking (`SELECT ... FOR UPDATE`)',
        approachB: 'Optimistic Locking with Database Versioning',
        verdict: 'Optimistic locking is superior for high read-to-write ratios with low contention.',
        prosA: ['Guarantees no race condition retries'],
        prosB: ['No database row deadlocks', 'Fast non-blocking read performance'],
        whenToUse: 'Optimistic locking for standard hotel rooms; Pessimistic locking for 1-of-1 presidential suites.'
      }
    ],
    keyTakeaways: [
      { title: 'Optimistic Locking Versioning', description: 'Prevents race conditions without holding persistent database locks.' },
      { title: '10-Minute Hold TTL', description: 'Redis TTL automatically cleans up abandoned shopping carts.' }
    ],
    hasInteractiveLab: false,
    labType: 'generic'
  },
  {
    id: 23,
    slug: 'distributed-email-service',
    number: '23',
    title: 'Distributed Email Service',
    category: 'Real-World Scale Systems',
    difficulty: 'Advanced',
    readTimeMin: 16,
    summary: 'Design Gmail / Outlook. SMTP, IMAP, POP3 protocols, Distributed Mail Transfer Agents (MTA), Anti-spam filtering, Search indexing, and Large attachment handling.',
    problemStatement: 'Design a distributed email service for 1 Billion active users sending and receiving 100 Billion emails per day with instant search and 99.999% deliverability.',
    keyRequirements: {
      functional: ['Send and receive emails with attachments', 'Search emails by keyword, sender, date', 'Filter spam and malicious attachments', 'Organize emails into folders/labels'],
      nonFunctional: ['Zero email data loss (durability)', 'P99 Email delivery latency < 10 seconds', 'Fast full-text search < 100ms']
    },
    intuition: {
      analogy: 'An international postal sorting hub. Mail arrives from foreign airports (SMTP from external domains), passes through security X-ray scanners (Spam filter), gets sorted into localized postal bags (User mailboxes in Cassandra), and sends a notification slip to the resident’s door.',
      whyNaiveFails: 'Storing emails as simple BLOBs in MySQL causes rapid disk exhaustion and makes full-text search across 50,000 emails per user painfully slow.',
      coreInsight: 'Separate Email Metadata (Cassandra / BigTable) from Raw RFC-822 Email Payloads and Attachments (S3 Object Store). Index message headers in Elasticsearch for instantaneous full-text search.'
    },
    architectureNodes: [
      { id: 'sender', label: 'Sending Client / Domain', type: 'client', description: 'Sends email via SMTP (Port 587 / 25)', x: 50, y: 150 },
      { id: 'smtp_in', label: 'Inbound SMTP MTA Fleet', type: 'gateway', description: 'Receives external emails, validates SPF, DKIM, DMARC', x: 260, y: 150 },
      { id: 'spam_engine', label: 'Anti-Spam & Virus Scanner', type: 'service', description: 'ML classification model scoring spam probability', x: 480, y: 80 },
      { id: 'mail_db', label: 'Distributed Mailbox DB (Cassandra)', type: 'database', description: 'Stores email metadata, folders, read status', x: 720, y: 80 },
      { id: 's3_raw', label: 'Raw Email & Attachment S3 Store', type: 'storage', description: 'Encrypted object storage for full email bodies', x: 720, y: 220 },
      { id: 'elastic', label: 'Elasticsearch Cluster', type: 'service', description: 'Inverted index for rapid email search', x: 480, y: 240 }
    ],
    architectureEdges: [
      { from: 'sender', to: 'smtp_in', label: 'SMTP Transmission', animated: true },
      { from: 'smtp_in', to: 'spam_engine', label: 'Inspect Email' },
      { from: 'spam_engine', to: 'mail_db', label: 'Save Metadata' },
      { from: 'spam_engine', to: 's3_raw', label: 'Store Raw Body & Attachments' },
      { from: 'spam_engine', to: 'elastic', label: 'Index Search Terms' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'SMTP Ingestion & Domain Authentication',
        description: 'Inbound MTA server accepts connection. Verifies sender authenticity using SPF (Sender Policy Framework), DKIM cryptographic signatures, and DMARC policies.',
        activeNodeIds: ['sender', 'smtp_in'],
        highlightTip: 'Failing DKIM/SPF immediately quarantines phishing emails.'
      },
      {
        stepNumber: 2,
        title: 'Spam Filtering & Attachment Extraction',
        description: 'Anti-spam engine extracts attachments, runs antivirus scanning, and scores message body with machine learning classifiers.',
        activeNodeIds: ['smtp_in', 'spam_engine'],
        highlightTip: 'Attachments larger than 25MB are converted into cloud download links.'
      },
      {
        stepNumber: 3,
        title: 'Decoupled Storage & Search Indexing',
        description: 'Email metadata (subject, sender, timestamp) is committed to Cassandra. Raw RFC-822 message body is written to S3. Subject and body tokens are indexed in Elasticsearch.',
        activeNodeIds: ['spam_engine', 'mail_db', 's3_raw', 'elastic'],
        highlightTip: 'User mailbox UI loads instantaneously by querying metadata first.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Email Deliverability: SPF, DKIM, and DMARC',
        content: '• **SPF**: DNS TXT record listing authorized IP addresses that can send email for a domain.\n• **DKIM**: Public/private key cryptographic signature attached in email header proving email was not tampered in transit.\n• **DMARC**: Policy instructing receiving mail servers what to do if SPF or DKIM fails (Reject vs Quarantine).'
      }
    ],
    tradeoffs: [
      {
        approachA: 'Single DB Table Storing Full Email Body',
        approachB: 'Separated Metadata (Cassandra) + Blob Store (S3)',
        verdict: 'Separating metadata from blobs provides 10x faster inbox listing and infinite attachment scaling.',
        prosA: ['Single query fetch'],
        prosB: ['Lightning-fast inbox page renders', 'Low database storage footprint', 'Cheaper cold object storage for old emails'],
        whenToUse: 'Always decouple metadata from object storage for email and messaging.'
      }
    ],
    keyTakeaways: [
      { title: 'Separate Metadata from Blobs', description: 'Store headers in Cassandra and body/attachments in S3.' },
      { title: 'SPF / DKIM / DMARC', description: 'Mandatory security triple-pillar to prevent domain spoofing.' }
    ],
    hasInteractiveLab: false,
    labType: 'generic'
  },
  {
    id: 24,
    slug: 's3-like-object-storage',
    number: '24',
    title: 'S3-like Object Storage',
    category: 'Advanced Infrastructure',
    difficulty: 'Advanced',
    readTimeMin: 18,
    summary: 'Design Amazon S3 / Google Cloud Storage. Control plane vs Data plane, Erasure Coding (Reed-Solomon 8+4), Chunk stores, Metadata engine, and Garbage collection.',
    problemStatement: 'Design an exabyte-scale distributed object storage system supporting PUT and GET operations for arbitrary file sizes with 99.999999999% (11 9s) data durability.',
    keyRequirements: {
      functional: ['Upload, download, and delete immutable binary objects (blobs)', 'Support multipart uploads for large files (> 5GB)', 'Bucket management and access control policies'],
      nonFunctional: ['11 9s Data Durability (99.999999999%)', 'High throughput for streaming workloads', 'Cost-effective storage utilization using Erasure Coding']
    },
    intuition: {
      analogy: 'A secure warehouse with millions of storage lockers. When you store a painting, the warehouse cuts it into 8 puzzle pieces plus 4 backup math puzzle pieces (Erasure Coding) and places them in 12 different rooms. Even if 4 entire rooms burn down, the painting can be reconstructed with 100% precision.',
      whyNaiveFails: 'Simple 3x data replication requires 200% storage overhead (300TB disk needed for 100TB data), costing tens of millions of dollars at exabyte scale.',
      coreInsight: 'Erasure Coding (Reed-Solomon 8+4) provides equal or greater durability than 3x replication while requiring only 50% storage overhead (1.5x vs 3.0x).'
    },
    architectureNodes: [
      { id: 'client', label: 'Client / SDK (boto3)', type: 'client', description: 'PUT /bucket/video.mp4', x: 50, y: 150 },
      { id: 'api_gw', label: 'Data Plane API Gateway', type: 'gateway', description: 'Authenticates request and orchestrates chunking', x: 260, y: 150 },
      { id: 'meta_store', label: 'Metadata Store (Spanner / KV)', type: 'database', description: 'Maps object_name -> [chunk_ids, placement_map]', x: 500, y: 60 },
      { id: 'chunk_server1', label: 'Chunk Server Rack 1 (Data)', type: 'storage', description: 'Stores erasure-coded raw data chunks', x: 740, y: 60 },
      { id: 'chunk_server2', label: 'Chunk Server Rack 2 (Data)', type: 'storage', description: 'Stores erasure-coded raw data chunks', x: 740, y: 150 },
      { id: 'chunk_server3', label: 'Chunk Server Rack 3 (Parity)', type: 'storage', description: 'Stores parity recovery chunks', x: 740, y: 240 }
    ],
    architectureEdges: [
      { from: 'client', to: 'api_gw', label: 'PUT Object (Binary stream)', animated: true },
      { from: 'api_gw', to: 'meta_store', label: 'Register Object Metadata' },
      { from: 'api_gw', to: 'chunk_server1', label: 'Write Data Chunks' },
      { from: 'api_gw', to: 'chunk_server2', label: 'Write Data Chunks' },
      { from: 'api_gw', to: 'chunk_server3', label: 'Write Parity Chunks' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Erasure Coding & Chunk Generation',
        description: 'API Gateway splits incoming object into 8 data chunks, computes 4 parity chunks via Reed-Solomon coding (8+4 configuration).',
        activeNodeIds: ['client', 'api_gw'],
        highlightTip: 'Any 8 of the 12 total chunks can reconstruct the original file.'
      },
      {
        stepNumber: 2,
        title: 'Failure Domain Chunk Placement',
        description: 'Gateway writes the 12 chunks across 12 independent server racks and power zones to survive full rack/switch failures.',
        activeNodeIds: ['api_gw', 'chunk_server1', 'chunk_server2', 'chunk_server3'],
        highlightTip: 'Spreading chunks across failure domains achieves 11 9s durability.'
      },
      {
        stepNumber: 3,
        title: 'Metadata Commit',
        description: 'Once all chunks are written, gateway commits object metadata record `{ bucket_id, object_name, chunk_map, size, etag }` to distributed metadata store.',
        activeNodeIds: ['api_gw', 'meta_store'],
        highlightTip: 'Strong read-after-write consistency requires atomic metadata commits.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Erasure Coding vs 3x Replication Math',
        content: '• **3x Replication**: 100TB data requires 300TB raw storage (200% overhead). Can survive 2 server failures.\n• **Reed-Solomon (8+4) Erasure Coding**: 100TB data requires 150TB raw storage (50% overhead). Can survive 4 simultaneous server failures!\n\nAt 1 Exabyte scale, Erasure Coding saves hundreds of millions of dollars in hard drive procurement.'
      }
    ],
    tradeoffs: [
      {
        approachA: '3x Multi-Server Replication',
        approachB: 'Erasure Coding (Reed-Solomon 8+4)',
        verdict: 'Erasure Coding is mandatory for petabyte/exabyte scale object stores.',
        prosA: ['Low CPU computation', 'Instant read without decoding math'],
        prosB: ['Massive 50% storage cost reduction', 'Higher data durability (survives 4 dead disks vs 2)'],
        whenToUse: 'Erasure Coding for cold and warm object storage; Replication for low-latency hot cache tiers.'
      }
    ],
    keyTakeaways: [
      { title: 'Erasure Coding (8+4)', description: '50% storage overhead with higher durability than 3x replication.' },
      { title: 'Separate Control vs Data Plane', description: 'Metadata queries and binary chunk streaming scale independently.' }
    ],
    hasInteractiveLab: false,
    labType: 'generic'
  },
  {
    id: 25,
    slug: 'real-time-gaming-leaderboard',
    number: '25',
    title: 'Real-time Gaming Leaderboard',
    category: 'Real-World Scale Systems',
    difficulty: 'Intermediate',
    readTimeMin: 14,
    summary: 'Design Xbox / Steam / Mobile game leaderboards. Redis Sorted Sets (ZADD, ZREVRANK, ZREVRANGE), Distributed write sharding, and Tiered leaderboard caching.',
    problemStatement: 'Design a real-time global gaming leaderboard for 25M DAU returning top 100 players, user exact rank, and surrounding player scores in < 20ms.',
    keyRequirements: {
      functional: ['Display Top 100 global players', 'Display specific user rank and score', 'Display surrounding players (e.g. 5 ranks above & below user)'],
      nonFunctional: ['Sub-20ms rank query latency', 'Handle 50,000 score update QPS during tournament peak', 'High availability and score durability']
    },
    intuition: {
      analogy: 'A marathon leaderboard scoreboard. As thousands of runners cross checkpoints, their chip times are instantly placed into an organized ordered line (SkipList in Redis). Anyone can ask: "Who are the top 100?" or "What position is runner #504?" and get an instant answer.',
      whyNaiveFails: 'Executing `SELECT COUNT(*) FROM leaderboard WHERE score > my_score` on relational databases scans millions of rows, taking multiple seconds under peak load.',
      coreInsight: 'Redis Sorted Sets (ZSET) implemented via SkipLists. `ZADD` inserts score updates in O(log N) time, while `ZREVRANK` and `ZREVRANGE` fetch ranks and ranges in O(log N + M) time.'
    },
    architectureNodes: [
      { id: 'player', label: 'Game Client (Mobile / PC)', type: 'client', description: 'Posts new score: 8,450 pts', x: 50, y: 150 },
      { id: 'gateway', label: 'API Gateway', type: 'gateway', description: 'Authenticates score tokens', x: 260, y: 150 },
      { id: 'score_svc', label: 'Score & Leaderboard Service', type: 'service', description: 'Validates anti-cheat and updates Redis & DB', x: 480, y: 150 },
      { id: 'redis_zset', label: 'Redis Sorted Set (ZSET)', type: 'cache', description: 'In-memory SkipList holding player ranks & scores', x: 740, y: 80 },
      { id: 'db_persist', label: 'Relational DB (Persistent History)', type: 'database', description: 'Historical score archive & monthly season audit', x: 740, y: 220 }
    ],
    architectureEdges: [
      { from: 'player', to: 'gateway', label: 'POST /v1/scores', animated: true },
      { from: 'gateway', to: 'score_svc', label: 'Score Event' },
      { from: 'score_svc', to: 'redis_zset', label: 'ZADD / ZREVRANK', animated: true },
      { from: 'score_svc', to: 'db_persist', label: 'Async Write (Kafka)' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Score Update (ZADD)',
        description: 'Player finishes match. API service issues `ZADD leaderboard:season_5 8450 user_101` in Redis.',
        activeNodeIds: ['player', 'score_svc', 'redis_zset'],
        highlightTip: 'ZADD updates the SkipList node position in O(log N) microseconds.'
      },
      {
        stepNumber: 2,
        title: 'Top 100 Leaderboard Fetch',
        description: 'Client requests top 100 scoreboard. Service issues `ZREVRANGE leaderboard:season_5 0 99 WITHSCORES` in < 2ms.',
        activeNodeIds: ['score_svc', 'redis_zset'],
        highlightTip: 'Top 100 can be cached with a 5-second TTL to absorb extreme spikes.'
      },
      {
        stepNumber: 3,
        title: 'Relative Surrounding Player Rank',
        description: 'To display players near user: 1. Get rank: `ZREVRANK user_101` -> 450. 2. Fetch slice: `ZREVRANGE 445 455 WITHSCORES`.',
        activeNodeIds: ['score_svc', 'redis_zset'],
        highlightTip: 'Provides motivational surrounding context without loading full leaderboard.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Handling 100M+ Users with Redis Sharding',
        content: 'When user count exceeds single-node memory (or write throughput maxes out): Shard players into score brackets or game tiers (Bronze, Silver, Gold, Diamond), each with its own Redis ZSET. For global ranking, maintain a lightweight histogram of bucket counts.'
      }
    ],
    tradeoffs: [
      {
        approachA: 'Relational SQL Query (`ORDER BY score DESC`)',
        approachB: 'In-Memory Redis Sorted Set (SkipList)',
        verdict: 'Redis Sorted Sets are the gold standard for real-time leaderboards.',
        prosA: ['Direct persistence in SQL database'],
        prosB: ['O(log N) rank calculation in sub-millisecond', 'Zero database lock contention', 'Handles 100k+ writes/sec'],
        whenToUse: 'Redis ZSET for live gaming leaderboards.'
      }
    ],
    keyTakeaways: [
      { title: 'Redis SkipList Efficiency', description: 'ZADD, ZREVRANK, ZREVRANGE provide O(log N) rank calculation.' },
      { title: 'Score Sharding by Tier', description: 'Separate leaderboards by league tier (Bronze, Silver, Diamond).' }
    ],
    hasInteractiveLab: false,
    labType: 'generic'
  },
  {
    id: 26,
    slug: 'payment-system',
    number: '26',
    title: 'Payment System',
    category: 'Real-World Scale Systems',
    difficulty: 'Advanced',
    readTimeMin: 18,
    summary: 'Design Stripe / PayPal payment infrastructure. Pay-in & Pay-out flows, Double-entry bookkeeping, Idempotency keys, Reconciliation engine, and Distributed Transactions.',
    problemStatement: 'Design a fault-tolerant payment processing system handling $10 Billion in transactions annually with zero double-charging, strict double-entry auditing, and external PSP integration.',
    keyRequirements: {
      functional: ['Pay-in flow (charge buyer credit card via PSP like Stripe)', 'Pay-out flow (disburse funds to merchant bank accounts)', 'Double-entry bookkeeping ledger tracking every cent'],
      nonFunctional: ['100% financial accuracy (zero lost funds or double charges)', 'Idempotency across all payment endpoints', 'Nightly reconciliation detecting discrepancy between bank and internal ledger']
    },
    intuition: {
      analogy: 'A master accountant’s twin-column balance ledger. When $100 moves from a customer to a merchant, the accountant NEVER simply changes a balance variable. They record: Debit Customer Account (-$100) AND Credit Merchant Account (+$100). The sum of all debits and credits must ALWAYS equal exactly zero.',
      whyNaiveFails: 'Network timeouts between your server and Stripe/Visa cause unknown payment states. Retrying without idempotency keys charges the customer twice.',
      coreInsight: 'Idempotency Keys + Double-Entry Bookkeeping + Asynchronous Reconciliation. Every transaction request includes a unique UUID idempotency key preventing duplicate payment execution.'
    },
    architectureNodes: [
      { id: 'buyer', label: 'Buyer Checkout', type: 'client', description: 'Initiates $50 payment with Idempotency Key', x: 50, y: 150 },
      { id: 'pay_svc', label: 'Payment Service', type: 'gateway', description: 'Validates payment state machine & idempotency', x: 260, y: 150 },
      { id: 'psp', label: 'Payment Service Provider (Stripe/Adyen)', type: 'service', description: 'External card processing network', x: 500, y: 60 },
      { id: 'ledger', label: 'Double-Entry Bookkeeping DB', type: 'database', description: 'Immutable append-only ledger entries (Debit & Credit)', x: 500, y: 220 },
      { id: 'reconcile', label: 'Nightly Reconciliation Engine', type: 'worker', description: 'Compares bank settlement files against internal ledger', x: 750, y: 150 }
    ],
    architectureEdges: [
      { from: 'buyer', to: 'pay_svc', label: 'POST /v1/payments (Idempotency-Key)', animated: true },
      { from: 'pay_svc', to: 'psp', label: 'Execute Card Charge' },
      { from: 'pay_svc', to: 'ledger', label: 'Commit Double-Entry Record', animated: true },
      { from: 'psp', to: 'reconcile', label: 'Bank Settlement File' },
      { from: 'ledger', to: 'reconcile', label: 'Internal Ledger Audit' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Idempotency Check & Pre-Authorization',
        description: 'Payment service checks idempotency key in DB. If key exists in `SUCCESS` state, returns cached receipt without charging card again.',
        activeNodeIds: ['buyer', 'pay_svc'],
        highlightTip: 'Idempotency keys prevent double charges when users tap "Pay" multiple times.'
      },
      {
        stepNumber: 2,
        title: 'PSP Execution & Status Transition',
        description: 'Service calls Stripe API with idempotency token. State machine transitions from `INITIALIZED` -> `PENDING` -> `SUCCESS` via webhook callback.',
        activeNodeIds: ['pay_svc', 'psp'],
        highlightTip: 'Always rely on PSP webhooks with signature verification.'
      },
      {
        stepNumber: 3,
        title: 'Double-Entry Ledger Commitment',
        description: 'Atomic SQL transaction writes two records: 1. Debit User Account ($50.00). 2. Credit Merchant Settlement Account ($50.00). Total sum = $0.00.',
        activeNodeIds: ['pay_svc', 'ledger'],
        highlightTip: 'Double-entry accounting guarantees every cent is accounted for.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Double-Entry Bookkeeping Principle',
        content: `Rule: Sum of all debits must equal sum of all credits in every single financial transaction.

Example: User buys $100 shoes (Platform takes $10 fee, Seller gets $90):
1. Debit: Customer Cash Account: -$100
2. Credit: Platform Fee Revenue: +$10
3. Credit: Merchant Payable: +$90
Net Sum: (-100 + 10 + 90) = $0.00 (Balanced!)`
      }
    ],
    tradeoffs: [
      {
        approachA: 'Mutable Account Balance Column (`balance = balance - 100`)',
        approachB: 'Immutable Double-Entry Ledger Table',
        verdict: 'Immutable double-entry ledger is non-negotiable for financial compliance and audits.',
        prosA: ['Simple database schema'],
        prosB: ['Complete audit trail', 'Zero hidden bugs or balance corruption', 'Easy financial reconciliation'],
        whenToUse: 'Always use double-entry bookkeeping for payments.'
      }
    ],
    keyTakeaways: [
      { title: 'Idempotency Keys', description: 'Guarantees payment requests are executed exactly once regardless of retries.' },
      { title: 'Double-Entry Ledger', description: 'Immutable debit and credit records with sum = 0.' }
    ],
    hasInteractiveLab: false,
    labType: 'generic'
  },
  {
    id: 27,
    slug: 'digital-wallet',
    number: '27',
    title: 'Digital Wallet',
    category: 'Real-World Scale Systems',
    difficulty: 'Advanced',
    readTimeMin: 17,
    summary: 'Design high-frequency in-memory digital wallet balances (Venmo / Apple Cash). In-memory processing with Raft/Paxos consensus, CQRS, Distributed ledgers, and Event Sourcing.',
    problemStatement: 'Design a digital wallet system capable of processing 1,000,000 balance transfers/second with sub-5ms latency, zero negative balance overdrafts, and strict durability.',
    keyRequirements: {
      functional: ['Transfer balance between User A and User B in real time', 'Prevent account overdrafts (balance cannot drop below 0)', 'Provide instant balance lookups and transfer history'],
      nonFunctional: ['1M+ Transactions Per Second (TPS)', 'Sub-5ms P99 latency', 'Zero balance loss even during datacenter hardware crashes']
    },
    intuition: {
      analogy: 'A hyper-fast arcade token counter. Instead of waiting 5 seconds for a bank clerk to open a physical safety deposit box for every token trade, an in-memory master chip validates and moves tokens in nanoseconds, with a security camera log (Raft log) recording every move.',
      whyNaiveFails: 'Relational databases using standard two-phase commit (2PC) or distributed transactions max out at ~1,000-5,000 TPS due to lock contention on hot account balances.',
      coreInsight: 'In-Memory State Machines + Raft Consensus Replication (e.g. TigerBeetle / LMAX Disruptor architecture). Balances live in memory partitions, and transactions execute sequentially in lock-free single threads replicated across Raft nodes.'
    },
    architectureNodes: [
      { id: 'user', label: 'User Transfer Request', type: 'client', description: 'Transfer $20 from Alice -> Bob', x: 50, y: 150 },
      { id: 'gateway', label: 'API Gateway', type: 'gateway', description: 'Routes to account partition leader', x: 260, y: 150 },
      { id: 'raft_leader', label: 'In-Memory Wallet Node (Raft Leader)', type: 'service', description: 'Sequentially applies transfers to in-memory balance', x: 500, y: 80 },
      { id: 'raft_follower', label: 'Raft Consensus Followers', type: 'database', description: 'Replicates append-only transaction log across 3 nodes', x: 740, y: 80 },
      { id: 'cqrs_read', label: 'CQRS Read DB (Postgres/Redis)', type: 'cache', description: 'Read-only store serving balance history queries', x: 620, y: 240 }
    ],
    architectureEdges: [
      { from: 'user', to: 'gateway', label: 'POST /v1/transfer', animated: true },
      { from: 'gateway', to: 'raft_leader', label: 'Execute Transfer', animated: true },
      { from: 'raft_leader', to: 'raft_follower', label: 'Raft Log Replication (Quorum)' },
      { from: 'raft_leader', to: 'cqrs_read', label: 'Async Event Stream (Kafka)' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Partition Routing',
        description: 'Gateway determines account partition (e.g. Alice is in Partition 3). Routes transfer command to Partition 3 Raft Leader node.',
        activeNodeIds: ['user', 'gateway', 'raft_leader'],
        highlightTip: 'Partitioning by user ID enables linear horizontal scaling.'
      },
      {
        stepNumber: 2,
        title: 'In-Memory Validation & Raft Replication',
        description: 'Raft Leader verifies Alice balance >= $20 in memory. Leader appends transfer to Raft log and replicates to quorum of 2 out of 3 follower nodes.',
        activeNodeIds: ['raft_leader', 'raft_follower'],
        highlightTip: 'Sequential single-threaded in-memory execution eliminates lock contention.'
      },
      {
        stepNumber: 3,
        title: 'Commit & CQRS Read Projection',
        description: 'Once quorum acknowledges, balances update in RAM in < 1ms. An event is emitted to Kafka to update read-only CQRS database for transaction history.',
        activeNodeIds: ['raft_leader', 'cqrs_read'],
        highlightTip: 'CQRS separates high-throughput write engine from analytical read queries.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Event Sourcing & LMAX Disruptor Pattern',
        content: 'Never store only the current balance. Store the complete sequence of financial transfer events: `Balance = SUM(all past credit/debit events)`. In-memory ring buffers (Disruptor) process millions of events per second on a single CPU core without locks.'
      }
    ],
    tradeoffs: [
      {
        approachA: 'Distributed Database 2-Phase Commit (2PC)',
        approachB: 'In-Memory Partitioning with Raft Consensus',
        verdict: 'In-memory Raft partition architecture achieves 1,000x higher throughput.',
        prosA: ['Standard SQL interfaces'],
        prosB: ['1M+ TPS with sub-5ms latency', 'Zero database lock contention', 'Deterministic replayability'],
        whenToUse: 'In-memory Raft engines for ultra-high-frequency digital wallets and exchanges.'
      }
    ],
    keyTakeaways: [
      { title: 'In-Memory Raft Replication', description: 'Combines microsecond RAM speed with distributed disk durability.' },
      { title: 'CQRS Architecture', description: 'Isolates high-speed balance updates from historical read queries.' }
    ],
    hasInteractiveLab: false,
    labType: 'generic'
  },
  {
    id: 28,
    slug: 'stock-exchange',
    number: '28',
    title: 'Stock Exchange (Matching Engine)',
    category: 'Advanced Infrastructure',
    difficulty: 'Advanced',
    readTimeMin: 18,
    summary: 'Design high-frequency trading matching engines (NYSE / NASDAQ / Crypto Exchanges). L1/L2/L3 Order Books, FIFO matching algorithm, Microsecond latency, Fix Protocol, and Deterministic Sequencers.',
    problemStatement: 'Design an ultra-low latency financial matching engine capable of executing 100,000 orders/sec per stock symbol with sub-100 microsecond (µs) deterministic latency and zero order loss.',
    keyRequirements: {
      functional: ['Place Limit and Market Buy/Sell orders', 'Match crossing orders using Price-Time Priority (FIFO)', 'Publish real-time L2 order book market data feed'],
      nonFunctional: ['Sub-100 microsecond deterministic latency', '100% deterministic replayability (identical inputs produce identical order matches)', 'Zero order sequence anomalies']
    },
    intuition: {
      analogy: 'An ultra-fast auctioneer at the trading pit. Buyers hold green bid cards ordered by highest price; sellers hold red ask cards ordered by lowest price. When a buyer bids $100 and a seller asks $100, the auctioneer immediately snaps their fingers and completes the trade.',
      whyNaiveFails: 'Database transactions, network context switches, garbage collection pauses, and multi-threaded lock contention introduce milliseconds of unpredictable latency ("jitter") that high-frequency trading firms exploit.',
      coreInsight: 'Deterministic Sequencer + Single-Threaded In-Memory Matching Engine (Price-Time Priority Order Book). All incoming orders pass through a hardware Sequencer that stamps an incrementing 64-bit sequence number. A single-threaded matching engine consumes orders sequentially with zero locks and zero GC pauses.'
    },
    architectureNodes: [
      { id: 'trader', label: 'Trader / Institutional Algo', type: 'client', description: 'Sends FIX order: BUY 100 AAPL @ $180.50', x: 50, y: 150 },
      { id: 'fix_gw', label: 'FIX Gateway / Order Entry', type: 'gateway', description: 'Validates risk limits, margin & account funds', x: 260, y: 150 },
      { id: 'sequencer', label: 'Deterministic Sequencer', type: 'queue', description: 'Assigns monotonic 64-bit sequence ID & appends to WAL', x: 480, y: 150 },
      { id: 'matching_eng', label: 'In-Memory Matching Engine', type: 'service', description: 'Single-threaded Price-Time Priority Order Book (L2/L3)', x: 720, y: 80 },
      { id: 'market_data', label: 'Market Data Feed (UDP Multicast)', type: 'cdn', description: 'Broadcasts L2 book depth updates to global market', x: 720, y: 220 }
    ],
    architectureEdges: [
      { from: 'trader', to: 'fix_gw', label: 'FIX 4.4 NewOrderSingle', animated: true },
      { from: 'fix_gw', to: 'sequencer', label: 'Forward Order' },
      { from: 'sequencer', to: 'matching_eng', label: 'Ordered Stream', animated: true },
      { from: 'matching_eng', to: 'market_data', label: 'Publish Executions & Book' },
      { from: 'market_data', to: 'trader', label: 'UDP Multicast Feed' }
    ],
    flowSteps: [
      {
        stepNumber: 1,
        title: 'Risk Checks & Order Sequencing',
        description: 'FIX Gateway checks trader buying power in < 10µs. Sequencer stamps order with monotonic sequence #981023 and writes to NVMe log.',
        activeNodeIds: ['trader', 'fix_gw', 'sequencer'],
        highlightTip: 'Monotonic sequencing ensures 100% deterministic replayability.'
      },
      {
        stepNumber: 2,
        title: 'Price-Time Priority (FIFO) Matching',
        description: 'Single-threaded matching engine checks opposite book. If Limit Buy price >= Best Ask price, orders match. Unmatched remainder enters Order Book.',
        activeNodeIds: ['sequencer', 'matching_eng'],
        highlightTip: 'Order book uses doubly-linked lists inside a B-Tree / hash table for O(1) order insertion and cancellation.'
      },
      {
        stepNumber: 3,
        title: 'Market Data Broadcast (UDP Multicast)',
        description: 'Execution report is sent to buyer and seller. L2 depth update (Best Bid & Ask) broadcasts over UDP Multicast with sub-50µs latency.',
        activeNodeIds: ['matching_eng', 'market_data'],
        highlightTip: 'UDP Multicast delivers market data simultaneously to all market participants.'
      }
    ],
    deepDiveTopics: [
      {
        title: 'Price-Time Priority Matching Engine Data Structure',
        content: `Order Book Architecture:
1. Bids (Buy Orders): Sorted by Price DESCENDING.
2. Asks (Sell Orders): Sorted by Price ASCENDING.
3. At each price level: A Doubly-Linked List of orders arranged by timestamp (FIFO).

Time Complexity:
• Place Limit Order (no match): O(1) append to price list
• Match Order: O(1) pop from best price list head
• Cancel Order: O(1) removal via order_id hash map lookup`
      }
    ],
    tradeoffs: [
      {
        approachA: 'Multi-Threaded Database-Backed Engine',
        approachB: 'Single-Threaded In-Memory Deterministic Sequencer Engine',
        verdict: 'Single-threaded in-memory engines are standard in all modern stock and crypto exchanges (LMAX, Nasdaq, Binance).',
        prosA: ['Standard concurrent coding model'],
        prosB: ['Sub-100 microsecond deterministic execution', 'Zero lock contention or race conditions', '100% reproducible audit replay'],
        whenToUse: 'Always use single-threaded sequencer architecture for financial order matching.'
      }
    ],
    keyTakeaways: [
      { title: 'Deterministic Sequencer', description: 'Stamps monotonic sequence numbers for 100% replayable determinism.' },
      { title: 'Price-Time Priority (FIFO)', description: 'Best price matches first; ties broken by earliest order timestamp.' }
    ],
    hasInteractiveLab: true,
    labType: 'orderbook'
  }
];
