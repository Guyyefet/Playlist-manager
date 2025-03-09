package rate_limiter

import (
	"sync"
	"time"
)

type RateLimiter struct {
	mu       sync.Mutex
	requests map[string][]time.Time
	limits   map[string]int
	window   time.Duration
}

func NewRateLimiter(window time.Duration) *RateLimiter {
	return &RateLimiter{
		requests: make(map[string][]time.Time),
		limits:   make(map[string]int),
		window:   window,
	}
}

func (rl *RateLimiter) SetLimit(endpoint string, limit int) {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	rl.limits[endpoint] = limit
}

func (rl *RateLimiter) Allow(endpoint string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()

	// Clean up old requests
	cutoff := now.Add(-rl.window)
	requests := rl.requests[endpoint]
	var validRequests []time.Time
	for _, t := range requests {
		if t.After(cutoff) {
			validRequests = append(validRequests, t)
		}
	}
	rl.requests[endpoint] = validRequests

	// Check if request is allowed
	if len(validRequests) < rl.limits[endpoint] {
		rl.requests[endpoint] = append(rl.requests[endpoint], now)
		return true
	}

	return false
}
