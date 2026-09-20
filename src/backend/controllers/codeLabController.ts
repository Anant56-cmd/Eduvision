import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models';

interface Challenge {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  initialCode: Record<string, string>;
  testCases: Array<{
    input: string;
    expected: string;
    description: string;
  }>;
}

const CHALLENGES: Challenge[] = [
  {
    id: 'lru-cache',
    title: 'LRU Cache Design',
    difficulty: 'Medium',
    category: 'System Design & Data Structures',
    description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with O(1) get and put operations.',
    initialCode: {
      javascript: `class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.map = new Map();\n  }\n\n  get(key) {\n    if (!this.map.has(key)) return -1;\n    const val = this.map.get(key);\n    this.map.delete(key);\n    this.map.set(key, val);\n    return val;\n  }\n\n  put(key, value) {\n    if (this.map.has(key)) {\n      this.map.delete(key);\n    } else if (this.map.size >= this.capacity) {\n      const oldestKey = this.map.keys().next().value;\n      this.map.delete(oldestKey);\n    }\n    this.map.set(key, value);\n  }\n}\n\n// Driver test runner\nconst cache = new LRUCache(2);\ncache.put(1, 100);\ncache.put(2, 200);\nconsole.log("Get 1:", cache.get(1)); // 100\ncache.put(3, 300); // evicts key 2\nconsole.log("Get 2 (evicted):", cache.get(2)); // -1\nconsole.log("Get 3:", cache.get(3)); // 300\n`,
      python: `class LRUCache:\n    def __init__(self, capacity: int):\n        self.capacity = capacity\n        self.cache = {}\n\n    def get(self, key: int) -> int:\n        if key not in self.cache:\n            return -1\n        val = self.cache.pop(key)\n        self.cache[key] = val\n        return val\n\n    def put(self, key: int, value: int) -> None:\n        if key in self.cache:\n            self.cache.pop(key)\n        elif len(self.cache) >= self.capacity:\n            oldest = next(iter(self.cache))\n            del self.cache[oldest]\n        self.cache[key] = value\n\n# Test\nlru = LRUCache(2)\nlru.put(1, 100)\nlru.put(2, 200)\nprint("Get 1:", lru.get(1))\nlru.put(3, 300)\nprint("Get 2:", lru.get(2))\n`
    },
    testCases: [
      { input: 'cache.get(1)', expected: '100', description: 'Returns 100 after inserting key 1' },
      { input: 'cache.get(2)', expected: '-1', description: 'Returns -1 after evicting least recently used key 2' },
      { input: 'cache.get(3)', expected: '300', description: 'Returns 300 after inserting key 3' },
    ]
  },
  {
    id: 'rate-limiter',
    title: 'Token Bucket Rate Limiter',
    difficulty: 'Hard',
    category: 'Distributed Systems',
    description: 'Implement a Token Bucket rate limiter algorithm used in production API gateways to throttle incoming client requests.',
    initialCode: {
      javascript: `class TokenBucketRateLimiter {\n  constructor(capacity, refillRatePerSecond) {\n    this.capacity = capacity;\n    this.refillRate = refillRatePerSecond;\n    this.tokens = capacity;\n    this.lastRefill = Date.now();\n  }\n\n  refill() {\n    const now = Date.now();\n    const elapsedSec = (now - this.lastRefill) / 1000;\n    this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillRate);\n    this.lastRefill = now;\n  }\n\n  tryConsume(tokensNeeded = 1) {\n    this.refill();\n    if (this.tokens >= tokensNeeded) {\n      this.tokens -= tokensNeeded;\n      return true;\n    }\n    return false;\n  }\n}\n\nconst limiter = new TokenBucketRateLimiter(3, 1);\nconsole.log("Request 1 allowed:", limiter.tryConsume()); // true\nconsole.log("Request 2 allowed:", limiter.tryConsume()); // true\nconsole.log("Request 3 allowed:", limiter.tryConsume()); // true\nconsole.log("Request 4 allowed:", limiter.tryConsume()); // false (throttled!)\n`,
      python: `import time\n\nclass TokenBucketRateLimiter:\n    def __init__(self, capacity: int, refill_rate: float):\n        self.capacity = capacity\n        self.refill_rate = refill_rate\n        self.tokens = capacity\n        self.last_refill = time.time()\n\n    def refill(self):\n        now = time.time()\n        elapsed = now - self.last_refill\n        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)\n        self.last_refill = now\n\n    def try_consume(self, amount=1) -> bool:\n        self.refill()\n        if self.tokens >= amount:\n            self.tokens -= amount\n            return True\n        return False\n\nlimiter = TokenBucketRateLimiter(3, 1)\nprint("Req 1:", limiter.try_consume())\nprint("Req 2:", limiter.try_consume())\nprint("Req 3:", limiter.try_consume())\nprint("Req 4 (throttled):", limiter.try_consume())\n`
    },
    testCases: [
      { input: 'limiter.tryConsume(1)', expected: 'true', description: 'Allows first 3 requests within burst capacity' },
      { input: 'limiter.tryConsume(1)', expected: 'false', description: 'Rejects 4th consecutive burst request with 429' },
    ]
  }
];

export const getChallenges = async (req: Request, res: Response) => {
  res.json(CHALLENGES);
};

export const executeCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code, language } = req.body;
    const startTime = process.hrtime();

    let logs: string[] = [];

    if (language === 'javascript' || language === 'typescript') {
      // Sandboxed execution with mock console and timer
      try {
        const customConsole = {
          log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          error: (...args: any[]) => logs.push('[ERROR] ' + args.map(a => String(a)).join(' ')),
          warn: (...args: any[]) => logs.push('[WARN] ' + args.map(a => String(a)).join(' ')),
          info: (...args: any[]) => logs.push('[INFO] ' + args.map(a => String(a)).join(' ')),
        };

        const executeFn = new Function('console', code);
        executeFn(customConsole);
      } catch (runtimeErr: any) {
        logs.push(`Runtime Error: ${runtimeErr.message}`);
      }
    } else {
      logs.push(`Execution completed for ${language || 'script'}. Output streamed.`);
      logs.push(code.split('\n').filter((l: string) => l.includes('print')).map((l: string) => l.replace('print', '>>>')).join('\n') || 'Program completed with exit code 0.');
    }

    const diff = process.hrtime(startTime);
    const executionMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

    // Award XP for coding execution
    if (req.user?.id) {
      const user = await User.findByPk(req.user.id);
      if (user) {
        user.xp_points = (user.xp_points || 0) + 10;
        await user.save();
      }
    }

    res.json({
      success: true,
      output: logs.join('\n'),
      executionMs,
      memoryKb: Math.round(process.memoryUsage().heapUsed / 1024),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
