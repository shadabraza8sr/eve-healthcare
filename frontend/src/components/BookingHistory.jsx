
import { useMemo, useState } from "react";

function BookingHistory({
  bookings = [],
  bookingsLoading = false,
  bookingError = "",
  paymentMessage = "",
  cancelMessage = "",
  paymentLoading = null,
  cancelLoading = null,
  getCentre,
  getTest,
  getStatusClass,
  handlePayment,
  handleCancelBooking,
}) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  const statusFilters = [
    {
      value: "ALL",
      label: "All",
    },
    {
      value: "PENDING",
      label: "Pending",
    },
    {
      value: "CONFIRMED",
      label: "Confirmed",
    },
    {
      value: "FAILED",
      label: "Failed",
    },
    {
      value: "CANCELLED",
      label: "Cancelled",
    },
  ];

  const filteredBookings = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    const result = bookings.filter((booking) => {
      if (
        statusFilter !== "ALL" &&
        booking.status !== statusFilter
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const centre = getCentre(booking.centre_id);
      const test = getTest(booking.test_id);

      const searchableText = [
        booking.id,
        booking.status,
        centre?.name,
        centre?.location,
        test?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        normalizedSearch
      );
    });

    result.sort((first, second) => {
      const firstDate = new Date(
        first.appointment_at
      ).getTime();

      const secondDate = new Date(
        second.appointment_at
      ).getTime();

      return sortOrder === "newest"
        ? secondDate - firstDate
        : firstDate - secondDate;
    });

    return result;
  }, [
    bookings,
    statusFilter,
    search,
    sortOrder,
    getCentre,
    getTest,
  ]);

  const scrollToBooking = () => {
    document
      .getElementById("booking-section")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <section className="dashboard-section booking-history-section">
      <div className="section-heading">
        <div>
          <p className="section-eyebrow">
            ACTIVITY
          </p>

          <div className="section-title-row">
            <div className="section-icon">
              📋
            </div>

            <div>
              <h2>My Bookings</h2>

              <p>
                View and manage your diagnostic
                appointments.
              </p>
            </div>
          </div>
        </div>

        <span className="section-count">
          {bookings.length}{" "}
          {bookings.length === 1
            ? "booking"
            : "bookings"}
        </span>
      </div>

      {bookingError && (
        <div className="dashboard-notice booking-data-notice">
          <span className="dashboard-notice-icon">
            ℹ
          </span>

          <div>
            <strong>
              Booking data unavailable
            </strong>

            <p>
              Your booking history will appear here
              when the healthcare API is connected.
            </p>
          </div>
        </div>
      )}

      {paymentMessage && (
        <div className="booking-message">
          {paymentMessage}
        </div>
      )}

      {cancelMessage && (
        <div className="booking-message">
          {cancelMessage}
        </div>
      )}

      {!bookingError &&
        bookings.length > 0 && (
          <>
            <div className="booking-toolbar">
              <div className="booking-search">
                <span>⌕</span>

                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />
              </div>

              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(
                    event.target.value
                  )
                }
              >
                <option value="newest">
                  Newest first
                </option>

                <option value="oldest">
                  Oldest first
                </option>
              </select>
            </div>

            <div className="booking-filters">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={
                    statusFilter ===
                    filter.value
                      ? "filter-button active"
                      : "filter-button"
                  }
                  onClick={() =>
                    setStatusFilter(
                      filter.value
                    )
                  }
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </>
        )}

      {bookingsLoading ? (
        <div className="loading-card booking-loading">
          <div className="loading-spinner"></div>

          <span>
            Loading your booking history...
          </span>
        </div>
      ) : bookingError ? null : bookings.length === 0 ? (
        <div className="empty-state booking-empty-state">
          <div className="empty-icon">
            📅
          </div>

          <h3>No bookings yet</h3>

          <p>
            Your diagnostic appointments will appear
            here once you make a booking.
          </p>

          <button
            type="button"
            className="empty-booking-button"
            onClick={scrollToBooking}
          >
            Book your first test →
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="empty-state booking-empty-state">
          <div className="empty-icon">
            ⌕
          </div>

          <h3>No matching bookings</h3>

          <p>
            Try changing the status filter or
            search term.
          </p>
        </div>
      ) : (
        <div className="booking-list">
          {filteredBookings.map((booking) => {
            const centre = getCentre(
              booking.centre_id
            );

            const test = getTest(
              booking.test_id
            );

            const appointmentDate = new Date(
              booking.appointment_at
            );

            const canPay =
              booking.status === "PENDING";

            const canCancel =
              booking.status === "PENDING" ||
              booking.status === "CONFIRMED";

            return (
              <article
                className="booking-card"
                key={booking.id}
              >
                <div className="booking-card-header">
                  <div>
                    <span className="booking-id">
                      BOOKING #{booking.id}
                    </span>

                    <h3>
                      {test?.name ||
                        "Diagnostic Test"}
                    </h3>
                  </div>

                  <span
                    className={getStatusClass(
                      booking.status
                    )}
                  >
                    {booking.status}
                  </span>
                </div>

                <div className="booking-details">
                  <div>
                    <span>Centre</span>

                    <strong>
                      {centre?.name ||
                        "Diagnostic Centre"}
                    </strong>

                    {centre?.location && (
                      <small>
                        📍 {centre.location}
                      </small>
                    )}
                  </div>

                  <div>
                    <span>Appointment</span>

                    <strong>
                      {appointmentDate.toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </strong>

                    <small>
                      {appointmentDate.toLocaleTimeString(
                        "en-IN",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </small>
                  </div>

                  <div>
                    <span>Amount</span>

                    <strong>
                      ₹
                      {Number(
                        booking.amount || 0
                      ).toFixed(2)}
                    </strong>

                    <small>
                      Diagnostic service
                    </small>
                  </div>
                </div>

                {(canPay || canCancel) && (
                  <div className="booking-actions">
                    {canPay && (
                      <>
                        <button
                          type="button"
                          className="payment-success-button"
                          disabled={
                            paymentLoading ===
                            booking.id
                          }
                          onClick={() =>
                            handlePayment(
                              booking.id,
                              "SUCCESS"
                            )
                          }
                        >
                          {paymentLoading ===
                          booking.id
                            ? "Processing..."
                            : "Pay successfully"}
                        </button>

                        <button
                          type="button"
                          className="payment-failed-button"
                          disabled={
                            paymentLoading ===
                            booking.id
                          }
                          onClick={() =>
                            handlePayment(
                              booking.id,
                              "FAILED"
                            )
                          }
                        >
                          Simulate payment failure
                        </button>
                      </>
                    )}

                    {canCancel && (
                      <button
                        type="button"
                        className="cancel-button"
                        disabled={
                          cancelLoading ===
                          booking.id
                        }
                        onClick={() =>
                          handleCancelBooking(
                            booking.id
                          )
                        }
                      >
                        {cancelLoading ===
                        booking.id
                          ? "Cancelling..."
                          : "Cancel booking"}
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default BookingHistory;