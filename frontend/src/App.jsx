import React, { useEffect, useState } from "react";

const API_URL = "https://recoverai-nc4d.onrender.com";

function App() {
  const [evaluation, setEvaluation] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [activePage, setActivePage] = useState("overview");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ----------------------------------
  // Fetch recovery evaluation
  // ----------------------------------

  const fetchEvaluation = async () => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/recovery/evaluation`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to load recovery evaluation"
        );
      }

      setEvaluation(result.data);
    } catch (err) {
      console.error(
        "Evaluation fetch error:",
        err
      );

      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------
  // Fetch transactions
  // ----------------------------------

  const fetchTransactions = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/transactions`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to load transactions"
        );
      }

      const transactionData =
        result.data ||
        result.transactions ||
        [];

      setTransactions(
        Array.isArray(transactionData)
          ? transactionData
          : []
      );
    } catch (err) {
      console.error(
        "Transaction fetch error:",
        err
      );
    }
  };

  // ----------------------------------
  // Fetch audit logs
  // ----------------------------------

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/recovery/audit-logs`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to load audit logs"
        );
      }

      setAuditLogs(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (err) {
      console.error(
        "Audit logs fetch error:",
        err
      );
    }
  };

  // ----------------------------------
  // Refresh everything
  // ----------------------------------

  const refreshAll = () => {
    fetchEvaluation();
    fetchTransactions();
    fetchAuditLogs();
  };

  // ----------------------------------
  // Initial load + auto refresh
  // ----------------------------------

  useEffect(() => {
    refreshAll();

    const interval = setInterval(() => {
      refreshAll();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // ----------------------------------
  // Helpers
  // ----------------------------------

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const summary = evaluation?.summary || {};
  const actions = evaluation?.actions || {};
  const workflow = evaluation?.workflow || {};

  // ----------------------------------
  // Loading screen
  // ----------------------------------

  if (loading && !evaluation) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          <div className="logo">R</div>

          <h1>RecoverAI</h1>

          <p>
            Loading revenue recovery data...
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------
  // Error screen
  // ----------------------------------

  if (error && !evaluation) {
    return (
      <div className="loading-screen">
        <div className="error-card">
          <div className="logo">R</div>

          <h1>RecoverAI</h1>

          <p>{error}</p>

          <button
            onClick={() => {
              setLoading(true);
              refreshAll();
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-logo">
            R
          </div>

          <div>
            <h2>RecoverAI</h2>

            <span>
              Revenue Recovery
            </span>
          </div>

        </div>

        <nav>

          <button
            className={`nav-item ${
              activePage === "overview"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("overview")
            }
          >
            <span>▦</span>
            Overview
          </button>

          <button
            className={`nav-item ${
              activePage === "recovery"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("recovery")
            }
          >
            <span>↻</span>
            Recovery
          </button>

          <button
            className={`nav-item ${
              activePage === "transactions"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("transactions")
            }
          >
            <span>◉</span>
            Transactions
          </button>

          <button
            className={`nav-item ${
              activePage === "audit"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("audit")
            }
          >
            <span>✓</span>
            Audit Logs
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="system-status">

            <span className="status-dot"></span>

            <div>
              <strong>
                System Active
              </strong>

              <small>
                AI recovery engine online
              </small>
            </div>

          </div>

        </div>

      </aside>

      {/* MAIN */}

      <main className="main">

        {/* ==================================
            OVERVIEW PAGE
        ================================== */}

        {activePage === "overview" && (
          <OverviewPage
            summary={summary}
            actions={actions}
            workflow={workflow}
            transactions={transactions}
            money={money}
            fetchAll={refreshAll}
          />
        )}

        {/* ==================================
            RECOVERY PAGE
        ================================== */}

        {activePage === "recovery" && (
          <RecoveryPage
            summary={summary}
            workflow={workflow}
            actions={actions}
            money={money}
          />
        )}

        {/* ==================================
            TRANSACTIONS PAGE
        ================================== */}

        {activePage === "transactions" && (
          <TransactionsPage
            transactions={transactions}
            money={money}
          />
        )}

        {/* ==================================
            AUDIT LOGS PAGE
        ================================== */}

        {activePage === "audit" && (
          <AuditLogsPage
            auditLogs={auditLogs}
          />
        )}

      </main>

    </div>
  );
}


// ==================================================
// OVERVIEW PAGE
// ==================================================

function OverviewPage({
  summary,
  actions,
  workflow,
  transactions,
  money,
  fetchAll,
}) {
  return (
    <>
      {/* HEADER */}

      <header className="topbar">

        <div>

          <p className="eyebrow">
            AI REVENUE RECOVERY
          </p>

          <h1>
            Recovery Overview
          </h1>

          <p className="subtitle">
            Monitor failed payments, recovery
            actions and recovered revenue.
          </p>

        </div>

        <div className="header-actions">

          <div className="live-indicator">
            <span></span>
            Live
          </div>

          <button
            className="refresh-button"
            onClick={fetchAll}
          >
            ↻ Refresh
          </button>

        </div>

      </header>


      {/* KPI CARDS */}

      <section className="stats-grid">

        <div className="stat-card">

          <div className="stat-top">

            <span>
              Revenue at Risk
            </span>

            <div className="stat-icon risk">
              ₹
            </div>

          </div>

          <strong>
            {money(summary.atRiskAmount)}
          </strong>

          <p>
            Failed revenue requiring recovery
          </p>

        </div>


        <div className="stat-card">

          <div className="stat-top">

            <span>
              Revenue Recovered
            </span>

            <div className="stat-icon success">
              ✓
            </div>

          </div>

          <strong>
            {money(summary.recoveredAmount)}
          </strong>

          <p>
            Confirmed from captured payments
          </p>

        </div>


        <div className="stat-card">

          <div className="stat-top">

            <span>
              Recovery Rate
            </span>

            <div className="stat-icon blue">
              %
            </div>

          </div>

          <strong>
            {summary.recoveryRate || 0}%
          </strong>

          <p>
            Recovered / failed recovery cohort
          </p>

        </div>


        <div className="stat-card">

          <div className="stat-top">

            <span>
              Recovery Cohort
            </span>

            <div className="stat-icon purple">
              #
            </div>

          </div>

          <strong>
            {summary.recoveryCohort || 0}
          </strong>

          <p>
            Transactions evaluated
          </p>

        </div>

      </section>


      {/* RECOVERY PERFORMANCE + AI ACTIONS */}

      <section className="content-grid">

        <div className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Recovery Performance
              </h2>

              <p>
                Current transaction workflow
              </p>

            </div>

            <span className="badge">
              {summary.totalTransactions || 0} total
            </span>

          </div>


          <div className="workflow">

            <div className="workflow-item">

              <div className="workflow-number blue-bg">
                {workflow.inProgress || 0}
              </div>

              <div>

                <strong>
                  In Progress
                </strong>

                <span>
                  Recovery actions active
                </span>

              </div>

            </div>


            <div className="workflow-item">

              <div className="workflow-number orange-bg">
                {workflow.escalated || 0}
              </div>

              <div>

                <strong>
                  Escalated
                </strong>

                <span>
                  Human review required
                </span>

              </div>

            </div>


            <div className="workflow-item">

              <div className="workflow-number red-bg">
                {workflow.stopped || 0}
              </div>

              <div>

                <strong>
                  Stopped
                </strong>

                <span>
                  Recovery blocked or exhausted
                </span>

              </div>

            </div>


            <div className="workflow-item">

              <div className="workflow-number green-bg">
                {workflow.recovered || 0}
              </div>

              <div>

                <strong>
                  Recovered
                </strong>

                <span>
                  Payment successfully captured
                </span>

              </div>

            </div>

          </div>

        </div>


        {/* AI ACTIONS */}

        <div className="panel">

          <div className="panel-header">

            <div>

              <h2>
                AI Recovery Actions
              </h2>

              <p>
                Decisions generated by RecoverAI
              </p>

            </div>

          </div>

          <div className="action-list">

            <ActionRow
              label="Retry Payment"
              value={actions.RETRY_PAYMENT}
              icon="↻"
              className="blue"
            />

            <ActionRow
              label="Send Reminder"
              value={actions.SEND_REMINDER}
              icon="✉"
              className="purple"
            />

            <ActionRow
              label="Escalate"
              value={actions.ESCALATE}
              icon="!"
              className="orange"
            />

            <ActionRow
              label="Stop"
              value={actions.STOP}
              icon="■"
              className="red"
            />

          </div>

        </div>

      </section>


      {/* REVENUE RECOVERY */}

      <section className="panel revenue-panel">

        <div className="panel-header">

          <div>

            <h2>
              Revenue Recovery
            </h2>

            <p>
              Measured financial outcome from
              actual captured payments
            </p>

          </div>

          <div className="revenue-amount">
            {money(summary.recoveredAmount)}
          </div>

        </div>


        <div className="progress-container">

          <div className="progress-labels">

            <span>
              Recovered
            </span>

            <span>
              {summary.recoveryRate || 0}%
            </span>

          </div>

          <div className="progress-bar">

            <div
              className="progress-fill"
              style={{
                width: `${Math.min(
                  summary.recoveryRate || 0,
                  100
                )}%`,
              }}
            ></div>

          </div>

        </div>


        <div className="revenue-details">

          <div>

            <span>
              Total failed revenue
            </span>

            <strong>
              {money(summary.totalFailedAmount)}
            </strong>

          </div>

          <div>

            <span>
              Recovered revenue
            </span>

            <strong className="green-text">
              {money(summary.recoveredAmount)}
            </strong>

          </div>

          <div>

            <span>
              Still at risk
            </span>

            <strong>
              {money(summary.atRiskAmount)}
            </strong>

          </div>

        </div>

      </section>


      {/* TRANSACTION TABLE */}

      <section className="panel transactions-panel">

        <div className="panel-header">

          <div>

            <h2>
              Recent Recovery Transactions
            </h2>

            <p>
              Live transaction status and AI recovery actions
            </p>

          </div>

          <span className="badge">
            {transactions.length} transactions
          </span>

        </div>

        <TransactionTable
          transactions={transactions}
          money={money}
        />

      </section>


      {/* RECOVERY DECISION TIMELINE */}

      <section className="panel timeline-panel">

        <div className="panel-header">

          <div>

            <h2>
              Recovery Decision Flow
            </h2>

            <p>
              How RecoverAI handled payment recovery
            </p>

          </div>

        </div>

        <div className="timeline">

          <TimelineItem
            number="1"
            title="Payment Failure Detected"
            description="Razorpay payment failure webhook was received by RecoverAI."
            type="danger"
          />

          <TimelineItem
            number="2"
            title="AI Analyzed Transaction"
            description="RecoverAI evaluated the failure reason, retry count and recovery context."
            type="ai"
          />

          <TimelineItem
            number="3"
            title="Policy Engine Evaluated Action"
            description="The safety policy checked whether the AI recommendation was allowed."
            type="policy"
          />

          <TimelineItem
            number="4"
            title="Recovery Action Executed"
            description="The approved recovery workflow was executed within bounded limits."
            type="action"
          />

          <TimelineItem
            number="5"
            title="Payment Captured"
            description="Razorpay confirmed the successful payment through payment.captured."
            type="success"
          />

          <TimelineItem
            number="6"
            title="Revenue Recovered"
            description={`RecoverAI recorded ${money(
              summary.recoveredAmount
            )} as actually recovered revenue.`}
            type="success"
          />

        </div>

      </section>


      <Footer />
    </>
  );
}


// ==================================================
// RECOVERY PAGE
// ==================================================

function RecoveryPage({
  summary,
  workflow,
  actions,
  money,
}) {
  return (
    <>
      <header className="topbar">

        <div>

          <p className="eyebrow">
            RECOVERY ENGINE
          </p>

          <h1>
            Recovery
          </h1>

          <p className="subtitle">
            AI decisions, safety policies and
            bounded recovery workflows.
          </p>

        </div>

        <div className="live-indicator">
          <span></span>
          Live
        </div>

      </header>


      <section className="stats-grid">

        <div className="stat-card">
          <div className="stat-top">
            <span>In Progress</span>

            <div className="stat-icon blue">
              ↻
            </div>
          </div>

          <strong>
            {workflow.inProgress || 0}
          </strong>

          <p>
            Active recovery actions
          </p>
        </div>


        <div className="stat-card">
          <div className="stat-top">
            <span>Escalated</span>

            <div className="stat-icon risk">
              !
            </div>
          </div>

          <strong>
            {workflow.escalated || 0}
          </strong>

          <p>
            Human review required
          </p>
        </div>


        <div className="stat-card">
          <div className="stat-top">
            <span>Stopped</span>

            <div className="stat-icon risk">
              ■
            </div>
          </div>

          <strong>
            {workflow.stopped || 0}
          </strong>

          <p>
            Recovery blocked or exhausted
          </p>
        </div>


        <div className="stat-card">
          <div className="stat-top">
            <span>Recovered</span>

            <div className="stat-icon success">
              ✓
            </div>
          </div>

          <strong>
            {workflow.recovered || 0}
          </strong>

          <p>
            Successfully recovered
          </p>
        </div>

      </section>


      <section className="content-grid">

        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>
                Recovery Actions
              </h2>

              <p>
                AI-generated recovery decisions
              </p>
            </div>

          </div>

          <div className="action-list">

            <ActionRow
              label="Retry Payment"
              value={actions.RETRY_PAYMENT}
              icon="↻"
              className="blue"
            />

            <ActionRow
              label="Send Reminder"
              value={actions.SEND_REMINDER}
              icon="✉"
              className="purple"
            />

            <ActionRow
              label="Escalate"
              value={actions.ESCALATE}
              icon="!"
              className="orange"
            />

            <ActionRow
              label="Stop"
              value={actions.STOP}
              icon="■"
              className="red"
            />

          </div>

        </div>


        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>
                Financial Outcome
              </h2>

              <p>
                Actual recovered revenue
              </p>
            </div>

          </div>

          <div className="recovery-summary">

            <span>
              Revenue Recovered
            </span>

            <strong>
              {money(summary.recoveredAmount)}
            </strong>

          </div>

          <div className="recovery-summary">

            <span>
              Revenue Still at Risk
            </span>

            <strong>
              {money(summary.atRiskAmount)}
            </strong>

          </div>

        </div>

      </section>

      <Footer />
    </>
  );
}


// ==================================================
// TRANSACTIONS PAGE
// ==================================================

function TransactionsPage({
  transactions,
  money,
}) {
  return (
    <>
      <header className="topbar">

        <div>

          <p className="eyebrow">
            PAYMENT OPERATIONS
          </p>

          <h1>
            Transactions
          </h1>

          <p className="subtitle">
            Live payment and recovery status.
          </p>

        </div>

        <div className="live-indicator">
          <span></span>
          Live
        </div>

      </header>


      <section className="panel transactions-panel">

        <div className="panel-header">

          <div>

            <h2>
              All Transactions
            </h2>

            <p>
              Transactions monitored by RecoverAI
            </p>

          </div>

          <span className="badge">
            {transactions.length} transactions
          </span>

        </div>

        <TransactionTable
          transactions={transactions}
          money={money}
        />

      </section>

      <Footer />
    </>
  );
}


// ==================================================
// AUDIT LOGS PAGE
// ==================================================

function AuditLogsPage({
  auditLogs,
}) {
  return (
    <>
      <header className="topbar">

        <div>

          <p className="eyebrow">
            RECOVERY AUDIT TRAIL
          </p>

          <h1>
            Audit Logs
          </h1>

          <p className="subtitle">
            Complete record of AI decisions,
            policy checks and recovery actions.
          </p>

        </div>

        <div className="live-indicator">
          <span></span>
          Live
        </div>

      </header>


      <section className="panel">

        <div className="panel-header">

          <div>

            <h2>
              Recovery Activity
            </h2>

            <p>
              Events recorded by RecoverAI
            </p>

          </div>

          <span className="badge">
            {auditLogs.length} events
          </span>

        </div>


        <div className="audit-list">

          {auditLogs.length === 0 ? (

            <div className="empty-state">
              No audit events found.
            </div>

          ) : (

            auditLogs.map((log) => (

              <div
                className="audit-item"
                key={log._id}
              >

                <div className="audit-icon">
                  ✓
                </div>

                <div className="audit-content">

                  <div className="audit-top">

                    <div>

                      <strong>
                        {log.action}
                      </strong>

                      <span className="audit-transaction">
                        {log.transactionId}
                      </span>

                    </div>

                    <time>
                      {new Date(
                        log.createdAt
                      ).toLocaleString("en-IN")}
                    </time>

                  </div>


                  <p>
                    {log.reason ||
                      "Recovery event recorded."}
                  </p>


                  <div className="audit-meta">

                    <span>
                      Attempt:{" "}
                      {log.attemptNumber ?? 0}
                    </span>

                    {log.recoveryProbability !==
                      null &&
                      log.recoveryProbability !==
                        undefined && (
                        <span>
                          Confidence:{" "}
                          {(
                            log.recoveryProbability *
                            100
                          ).toFixed(0)}
                          %
                        </span>
                      )}

                    {log.result && (
                      <span>
                        Result: {log.result}
                      </span>
                    )}

                  </div>

                </div>

              </div>

            ))

          )}

        </div>

      </section>


      <Footer />
    </>
  );
}


// ==================================================
// TRANSACTION TABLE
// ==================================================

function TransactionTable({
  transactions,
  money,
}) {
  return (
    <div className="table-wrapper">

      <table>

        <thead>

          <tr>
            <th>Transaction</th>
            <th>Amount</th>
            <th>Status</th>
            <th>AI Action</th>
            <th>Retry</th>
            <th>Recovery</th>
          </tr>

        </thead>

        <tbody>

          {transactions.length === 0 ? (

            <tr>

              <td
                colSpan="6"
                className="empty-state"
              >
                No transactions found
              </td>

            </tr>

          ) : (

            transactions.map(
              (transaction) => (

                <tr
                  key={
                    transaction._id ||
                    transaction.transactionId
                  }
                >

                  <td>

                    <strong>
                      {transaction.transactionId}
                    </strong>

                    <small>
                      {transaction.paymentMethod ||
                        "Payment"}
                    </small>

                  </td>

                  <td>
                    {money(transaction.amount)}
                  </td>

                  <td>
                    <StatusBadge
                      status={
                        transaction.status
                      }
                    />
                  </td>

                  <td>
                    <ActionBadge
                      action={
                        transaction.lastRecoveryAction
                      }
                    />
                  </td>

                  <td>
                    {transaction.retryCount || 0}
                  </td>

                  <td>
                    <RecoveryBadge
                      status={
                        transaction.recoveryStatus
                      }
                    />
                  </td>

                </tr>

              )
            )

          )}

        </tbody>

      </table>

    </div>
  );
}


// ==================================================
// ACTION ROW
// ==================================================

function ActionRow({
  label,
  value,
  icon,
  className,
}) {
  return (
    <div className="action-row">

      <div
        className={`action-icon ${className}`}
      >
        {icon}
      </div>

      <span>
        {label}
      </span>

      <strong>
        {value || 0}
      </strong>

    </div>
  );
}


// ==================================================
// STATUS BADGE
// ==================================================

function StatusBadge({ status }) {
  const normalized =
    String(status || "").toLowerCase();

  let className = "status-neutral";

  if (normalized === "captured") {
    className = "status-success";
  }

  if (normalized === "failed") {
    className = "status-danger";
  }

  if (normalized === "pending") {
    className = "status-warning";
  }

  return (
    <span
      className={`table-badge ${className}`}
    >
      {status || "unknown"}
    </span>
  );
}


// ==================================================
// RECOVERY BADGE
// ==================================================

function RecoveryBadge({ status }) {
  const normalized =
    String(status || "").toLowerCase();

  let className = "status-neutral";

  if (normalized === "recovered") {
    className = "status-success";
  }

  if (normalized === "in_progress") {
    className = "status-warning";
  }

  if (normalized === "stopped") {
    className = "status-danger";
  }

  if (normalized === "escalated") {
    className = "status-purple";
  }

  return (
    <span
      className={`table-badge ${className}`}
    >
      {status || "not_required"}
    </span>
  );
}


// ==================================================
// AI ACTION BADGE
// ==================================================

function ActionBadge({ action }) {
  const normalized =
    String(action || "").toLowerCase();

  let className = "status-neutral";

  if (normalized === "retry_payment") {
    className = "status-blue";
  }

  if (normalized === "send_reminder") {
    className = "status-purple";
  }

  if (normalized === "escalate") {
    className = "status-warning";
  }

  if (normalized === "stop") {
    className = "status-danger";
  }

  if (normalized === "payment_captured") {
    className = "status-success";
  }

  return (
    <span
      className={`table-badge ${className}`}
    >
      {action || "NO_ACTION"}
    </span>
  );
}


// ==================================================
// TIMELINE
// ==================================================

function TimelineItem({
  number,
  title,
  description,
  type,
}) {
  return (
    <div className="timeline-item">

      <div
        className={`timeline-number ${type}`}
      >
        {number}
      </div>

      <div className="timeline-content">

        <strong>
          {title}
        </strong>

        <p>
          {description}
        </p>

      </div>

    </div>
  );
}


// ==================================================
// FOOTER
// ==================================================

function Footer() {
  return (
    <footer>

      <span>
        RecoverAI · AI Revenue Recovery
      </span>

      <span>
        Razorpay Test Mode
      </span>

    </footer>
  );
}


export default App;