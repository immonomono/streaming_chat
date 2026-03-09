#!/bin/bash
cd "$(dirname "$0")"

if [ -f .backend.pid ]; then
  kill $(cat .backend.pid) 2>/dev/null && echo "Backend stopped." || echo "Backend not running."
  rm -f .backend.pid
fi

if [ -f .frontend.pid ]; then
  kill $(cat .frontend.pid) 2>/dev/null && echo "Frontend stopped." || echo "Frontend not running."
  rm -f .frontend.pid
fi
