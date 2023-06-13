#!/usr/bin/env bash

parallel -j 3 curl ::: piyan.local:5000/reset 140.112.18.202:5000/reset localhost:3000/api/trpc/reset