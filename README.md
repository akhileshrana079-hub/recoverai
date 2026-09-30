# RecoverAI — AI Revenue Recovery Platform

RecoverAI is an AI-powered payment recovery platform built for the **Razorpay AI Buildathon — AI Revenue Recovery** track.

RecoverAI helps businesses reduce revenue leakage caused by failed payments by:

- Detecting failed payments
- Analyzing payment failure context using AI
- Selecting a bounded recovery action
- Enforcing deterministic safety policies
- Executing controlled recovery workflows
- Recording recovery decisions in an audit trail
- Measuring actual revenue recovered

---

## 🚀 Live Demo

### RecoverAI Dashboard

https://recoverai-dashboard-6wts.onrender.com

### Backend API

https://recoverai-nc4d.onrender.com

### Backend Health Check

https://recoverai-nc4d.onrender.com/api/health

---

## 🎯 Problem

Failed payments represent direct revenue leakage for online businesses.

A payment can fail for many different reasons:

- Temporary payment failures
- Customer-actionable failures
- Repeated payment attempts
- Risk or suspicious-payment signals
- Payment-provider errors

Simply retrying every failed payment is not safe or efficient.

RecoverAI addresses this problem by combining **AI decision-making with deterministic policy enforcement**.

Instead of automatically retrying every failed payment, RecoverAI determines what action should happen next.

---

## 💡 Solution

RecoverAI creates an AI-powered payment recovery workflow:

```text
Payment Failure
       ↓
Razorpay Webhook
       ↓
Transaction Stored in MongoDB
       ↓
AI Recovery Analysis
       ↓
Recovery Policy Engine
       ↓
Bounded Recovery Action
       ↓
Audit Log
       ↓
Payment Outcome
       ↓
Revenue Recovery Evaluation
       ↓
React Dashboard