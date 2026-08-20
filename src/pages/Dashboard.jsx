import { useCallback, useEffect, useState } from "react";
import { getDoctorDashboard } from "../api";
import { useAuth } from "../auth/useAuth";
import { Avatar, Badge, ErrorState, LoadingState, StatCard } from "../components/ui/UI";
import styles from "./Dashboard.module.scss";

function todayISO() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function Dashboard() {
  const { user } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [state, setState] = useState("loading");
  const [data, setData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async (selectedDate) => {
    setState("loading");
    try {
      const response = await getDoctorDashboard({ date: selectedDate });
      setData(response.data.data);
      setState("success");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Couldn't load your dashboard.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);

  const firstName = user?.name?.split(" ")[0] || "Doctor";

  return (
    <div className={styles.dashboard}>
      <header className={styles.dashboardHeader}>
        <div className={styles.headerCopy}>
          <span className={styles.eyebrow}>Clinic overview</span>
          <h1 className={styles.pageTitle}>Welcome back, {firstName}</h1>
          <p className={styles.pageSubtitle}>
            A clear view of your clinic activity, appointments, and patient flow.
          </p>
        </div>
        <label className={styles.dateControl}>
          <span>Viewing</span>
          <input
            type="date"
            className={styles.dateInput}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
      </header>

      {state === "loading" && <LoadingState label="Loading your dashboard…" />}

      {state === "error" && (
        <ErrorState message={errorMessage} onRetry={() => load(date)} />
      )}

      {state === "success" && data && (
        <>
          <div className={styles.grid}>
            <StatCard
              label="Today's appointments"
              value={data.todayAppointments}
            />
            <StatCard
              label="Total patients"
              value={data.stats.patients.total}
              changePercent={data.stats.patients.changePercent}
            />
            <StatCard
              label="Appointments this week"
              value={data.stats.appointments.total}
              changePercent={data.stats.appointments.changePercent}
            />
            <StatCard
              label="Revenue this week"
              value={`EGP ${data.stats.revenue.total}`}
              changePercent={data.stats.revenue.changePercent}
            />
          </div>

          <div className={styles.mainRow}>
            <div className={styles.primaryColumn}>
              <section className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <span className={styles.cardEyebrow}>Up next</span>
                    <h2 className={styles.sectionTitle}>Next patient</h2>
                  </div>
                  <Badge status={data.status}>{data.status?.replace("_", " ")}</Badge>
                </div>

                {data.nextPatient ? (
                  <div className={styles.nextCard}>
                    <Avatar
                      className={styles.nextAvatar}
                      name={data.nextPatient.patient?.fullName}
                    />
                    <div className={styles.nextDetails}>
                      <div className={styles.nextName}>{data.nextPatient.patient?.fullName}</div>
                      <div className={styles.nextMeta}>
                        {data.nextPatient.timeLabel} · {data.nextPatient.visitType} · {data.nextPatient.modeLabel}
                      </div>
                    </div>
                    <Badge status={data.nextPatient.status}>{data.nextPatient.statusLabel}</Badge>
                  </div>
                ) : (
                  <div className={styles.emptyInline}>
                    No upcoming patients for this date.
                  </div>
                )}
              </section>

              <section className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <span className={styles.cardEyebrow}>Today</span>
                    <h2 className={styles.sectionTitle}>Patient queue</h2>
                  </div>
                  <span className={styles.mutedCount}>{data.queue.length} in queue</span>
                </div>

                {data.queue.length === 0 ? (
                  <div className={styles.emptyInline}>
                    No appointments scheduled for this date yet.
                  </div>
                ) : (
                  <div className={styles.queueList}>
                    {data.queue.map((item) => (
                      <div className={styles.queueItem} key={item.id}>
                        <span className={styles.queueNum}>#{item.queueNumber}</span>
                        <Avatar className={styles.avatar} name={item.patient?.fullName} />
                        <div className={styles.queueInfo}>
                          <div className={styles.queueName}>{item.patient?.fullName}</div>
                          <div className={styles.queueMeta}>
                            {item.timeLabel} · {item.visitType}
                          </div>
                        </div>
                        <Badge status={item.status}>{item.statusLabel}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <section className={`${styles.card} ${styles.doctorsCard}`}>
              <div className={styles.cardHead}>
                <div>
                  <span className={styles.cardEyebrow}>This week</span>
                  <h2 className={styles.sectionTitle}>Popular doctors</h2>
                </div>
                <span className={styles.mutedCount}>Top 6</span>
              </div>

              <div className={styles.popularGrid}>
                {data.popularDoctors.slice(0, 6).map((doctor) => (
                  <div className={styles.popularCard} key={doctor.id}>
                    <Avatar className={styles.popularAvatar} name={doctor.name} />
                    <div className={styles.popularDetails}>
                      <div className={styles.popularName}>{doctor.name}</div>
                      <div className={styles.popularSpecialty}>{doctor.specialty?.name}</div>
                    </div>
                    <Badge status="confirmed">{doctor.bookings} bookings</Badge>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
