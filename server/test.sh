#!/bin/bash

# Factory Bound Multiplayer Test Script

echo "================================"
echo "Factory Bound Multiplayer Tests"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo "Starting multiplayer server..."
cd "$(dirname "$0")" || exit 1

# Start server in background
npm run dev > /tmp/multiplayer-server.log 2>&1 &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# Wait for server to start
echo "Waiting for server to start..."
sleep 4

echo ""
echo "Running tests..."
echo ""

# Test 1: Health endpoint
echo "Test 1: Server health check"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)
if [ "$HTTP_CODE" = "200" ]; then
    HEALTH_DATA=$(curl -s http://localhost:3001/health)
    test_result 0 "Health endpoint responding (HTTP $HTTP_CODE)"
    echo "   Response: $HEALTH_DATA"
else
    test_result 1 "Health endpoint not responding (HTTP $HTTP_CODE)"
fi

echo ""

# Test 2: Server is running
echo "Test 2: Server process check"
if ps -p $SERVER_PID > /dev/null; then
    test_result 0 "Server process is running"
else
    test_result 1 "Server process not found"
fi

echo ""

# Test 3: WebSocket endpoint accessible
echo "Test 3: WebSocket endpoint"
if nc -z localhost 3001 2>/dev/null; then
    test_result 0 "Port 3001 is listening"
else
    test_result 1 "Port 3001 not accessible"
fi

echo ""
echo "Server logs (last 20 lines):"
echo "----------------------------"
tail -20 /tmp/multiplayer-server.log
echo "----------------------------"

echo ""
echo "================================"
echo "Test Summary"
echo "================================"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

# Cleanup
echo "Stopping server (PID: $SERVER_PID)..."
if [ -n "$SERVER_PID" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
fi

echo "Done!"

# Return appropriate exit code
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed${NC}"
    exit 1
fi
