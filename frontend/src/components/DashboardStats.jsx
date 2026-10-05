function DashboardStats({
  bookings = [],
  allTests = [],
}) {
  const totalBookings = bookings.length;

  const confirmedBookings =
    bookings.filter(
      (booking) =>
        booking.status === "CONFIRMED"
    ).length;

  const pendingBookings =
    bookings.filter(
      (booking) =>
        booking.status === "PENDING"
    ).length;

  const failedBookings =
    bookings.filter(
      (booking) =>
        booking.status === "FAILED"
    ).length;

  const cancelledBookings =
    bookings.filter(
      (booking) =>
        booking.status === "CANCELLED"
    ).length;

  const totalSpent = bookings
    .filter(
      (booking) =>
        booking.status === "CONFIRMED"
    )
    .reduce(
      (total, booking) =>
        total + Number(booking.amount || 0),
      0
    );

  const stats = [
    {
      icon: "▣",
      label: "Total bookings",
      value: totalBookings,
      className: "stat-blue",
    },
    {
      icon: "✓",
      label: "Confirmed",
      value: confirmedBookings,
      className: "stat-green",
    },
    {
      icon: "◷",
      label: "Pending",
      value: pendingBookings,
      className: "stat-orange",
    },
    {
      icon: "₹",
      label: "Total spent",
      value: `₹${totalSpent.toFixed(2)}`,
      className: "stat-purple",
    },
    {
      icon: "⌕",
      label: "Available tests",
      value: allTests.length,
      className: "stat-teal",
    },
    {
      icon: "!",
      label: "Failed / cancelled",
      value:
        failedBookings +
        cancelledBookings,
      className: "stat-red",
    },
  ];

  return (
    <section className="dashboard-stats">
      {stats.map((stat) => (
        <article
          className={`stat-card ${stat.className}`}
          key={stat.label}
        >
          <div className="stat-icon">
            {stat.icon}
          </div>

          <div className="stat-content">
            <p>{stat.label}</p>

            <h2>{stat.value}</h2>
          </div>
        </article>
      ))}
    </section>
  );
}

export default DashboardStats;