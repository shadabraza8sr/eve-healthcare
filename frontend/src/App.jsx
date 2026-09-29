import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import api from "./services/api";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function Dashboard() {
  const navigate = useNavigate();

  const [centres, setCentres] = useState([]);
  const [tests, setTests] = useState([]);
  const [centreTests, setCentreTests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCentre, setSelectedCentre] = useState("");
  const [selectedTest, setSelectedTest] = useState("");
  const [appointmentAt, setAppointmentAt] = useState("");

  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingError, setBookingError] = useState("");

  const [paymentLoading, setPaymentLoading] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState("");

  const [cancelLoading, setCancelLoading] = useState(null);
  const [cancelMessage, setCancelMessage] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          centresResponse,
          testsResponse,
          centreTestsResponse,
        ] = await Promise.all([
          api.get("/centres/"),
          api.get("/tests/"),
          api.get("/centre-tests/"),
        ]);

        const allCentres = centresResponse.data;
        const allTests = testsResponse.data;
        const allCentreTests = centreTestsResponse.data;

        // Keep only the original catalogue records.
        // Extra records were created by backend tests.
        const visibleCentres = allCentres.filter(
          (centre) => centre.id <= 3
        );

        const visibleTests = allTests.filter(
          (test) => test.id <= 3
        );

        const visibleCentreTests = allCentreTests.filter(
          (item) =>
            item.centre_id <= 3 &&
            item.test_id <= 3
        );

        setCentres(visibleCentres);
        setTests(visibleTests);
        setCentreTests(visibleCentreTests);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
            "Unable to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get("/bookings/");
        setBookings(response.data);
      } catch (err) {
        setBookingError(
          err.response?.data?.detail ||
            "Unable to load bookings"
        );
      } finally {
        setBookingsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const logout = () => {
    localStorage.removeItem("access_token");
    navigate("/");
  };

  const getCentre = (centreId) => {
    return centres.find(
      (centre) => centre.id === centreId
    );
  };

  const getTest = (testId) => {
    return tests.find(
      (test) => test.id === testId
    );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "status-badge status-confirmed";

      case "FAILED":
        return "status-badge status-failed";

      case "CANCELLED":
        return "status-badge status-cancelled";

      case "PENDING":
      default:
        return "status-badge status-pending";
    }
  };

  // Tests available at the selected centre
  const availableTests = centreTests.filter(
    (item) =>
      item.centre_id === Number(selectedCentre)
  );

  const handleCentreChange = (event) => {
    setSelectedCentre(event.target.value);
    setSelectedTest("");
  };

  const handleBooking = async (event) => {
    event.preventDefault();

    setBookingMessage("");
    setBookingLoading(true);

    try {
      await api.post("/bookings/", {
        centre_id: Number(selectedCentre),
        test_id: Number(selectedTest),
        appointment_at: appointmentAt,
      });

      setBookingMessage(
        "Booking created successfully."
      );

      const response = await api.get("/bookings/");
      setBookings(response.data);

      setSelectedCentre("");
      setSelectedTest("");
      setAppointmentAt("");
    } catch (err) {
      setBookingMessage(
        err.response?.data?.detail ||
          "Unable to create booking"
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePayment = async (bookingId, result) => {
    setPaymentMessage("");
    setPaymentLoading(bookingId);

    try {
      await api.post("/payments/", {
        booking_id: bookingId,
        result: result,
      });

      setPaymentMessage(
        result === "SUCCESS"
          ? "Payment successful. Booking confirmed."
          : "Payment failed. Booking marked as failed."
      );

      const response = await api.get("/bookings/");
      setBookings(response.data);
    } catch (err) {
      setPaymentMessage(
        err.response?.data?.detail ||
          "Unable to process payment"
      );
    } finally {
      setPaymentLoading(null);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    setCancelMessage("");
    setCancelLoading(bookingId);

    try {
      await api.patch(
        `/bookings/${bookingId}/cancel`
      );

      setCancelMessage(
        "Booking cancelled successfully."
      );

      const response = await api.get("/bookings/");
      setBookings(response.data);
    } catch (err) {
      setCancelMessage(
        err.response?.data?.detail ||
          "Unable to cancel booking"
      );
    } finally {
      setCancelLoading(null);
    }
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="brand">
          <span className="brand-icon">+</span>
          <span>EVE Healthcare</span>
        </div>

        <button
          className="logout-button"
          onClick={logout}
        >
          Logout
        </button>
      </nav>

      <main className="dashboard-content">
        <section className="welcome">
          <h1>Your healthcare dashboard</h1>

          <p>
            Find diagnostic centres, browse tests,
            and book appointments.
          </p>
        </section>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <section className="dashboard-card">
            <p>
              Loading healthcare services...
            </p>
          </section>
        ) : (
          <>
            {/* Diagnostic Centres */}

            <section className="dashboard-card">
              <div className="dashboard-card-icon">
                🏥
              </div>

              <h2>Diagnostic Centres</h2>

              <div className="centre-list">
                {centres.map((centre) => (
                  <div
                    className="centre-item"
                    key={centre.id}
                  >
                    <h3>{centre.name}</h3>

                    <p>
                      📍 {centre.location}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Available Tests */}

            <section className="dashboard-card">
              <div className="dashboard-card-icon">
                🧪
              </div>

              <h2>Available Tests</h2>

              <div className="centre-list">
                {centreTests.map((item) => {
                  const centre = getCentre(
                    item.centre_id
                  );

                  const test = getTest(
                    item.test_id
                  );

                  if (!centre || !test) {
                    return null;
                  }

                  return (
                    <div
                      className="centre-item"
                      key={item.id}
                    >
                      <h3>{test.name}</h3>

                      <p>
                        🏥 {centre.name} · 📍{" "}
                        {centre.location}
                      </p>

                      <p>
                        {test.description ||
                          "Diagnostic test"}
                      </p>

                      <strong>
                        ₹
                        {Number(
                          item.price
                        ).toFixed(2)}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Book Test */}

            <section className="dashboard-card">
              <div className="dashboard-card-icon">
                📅
              </div>

              <h2>Book a Test</h2>

              {bookingMessage && (
                <div className="booking-message">
                  {bookingMessage}
                </div>
              )}

              <form onSubmit={handleBooking}>
                <label>
                  Diagnostic Centre
                </label>

                <select
                  value={selectedCentre}
                  onChange={handleCentreChange}
                  required
                >
                  <option value="">
                    Select a centre
                  </option>

                  {centres.map((centre) => (
                    <option
                      key={centre.id}
                      value={centre.id}
                    >
                      {centre.name} -{" "}
                      {centre.location}
                    </option>
                  ))}
                </select>

                <label>
                  Diagnostic Test
                </label>

                <select
                  value={selectedTest}
                  onChange={(event) =>
                    setSelectedTest(
                      event.target.value
                    )
                  }
                  required
                  disabled={!selectedCentre}
                >
                  <option value="">
                    {selectedCentre
                      ? "Select a test"
                      : "Select a centre first"}
                  </option>

                  {availableTests.map((item) => {
                    const test = getTest(
                      item.test_id
                    );

                    if (!test) {
                      return null;
                    }

                    return (
                      <option
                        key={item.id}
                        value={test.id}
                      >
                        {test.name} - ₹
                        {Number(
                          item.price
                        ).toFixed(2)}
                      </option>
                    );
                  })}
                </select>

                <label>
                  Appointment Date &amp; Time
                </label>

                <input
                  type="datetime-local"
                  value={appointmentAt}
                  onChange={(event) =>
                    setAppointmentAt(
                      event.target.value
                    )
                  }
                  required
                />

                <button
                  type="submit"
                  disabled={
                    bookingLoading ||
                    !selectedCentre ||
                    !selectedTest
                  }
                >
                  {bookingLoading
                    ? "Booking..."
                    : "Book Test"}
                </button>
              </form>
            </section>

            {/* My Bookings */}

            <section className="dashboard-card">
              <div className="dashboard-card-icon">
                📋
              </div>

              <h2>My Bookings</h2>

              {bookingError && (
                <div className="error-message">
                  {bookingError}
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

              {bookingsLoading ? (
                <p>
                  Loading your bookings...
                </p>
              ) : bookings.length === 0 ? (
                <p>No bookings yet.</p>
              ) : (
                <div className="centre-list">
                  {bookings.map((booking) => {
                    const centre = getCentre(
                      booking.centre_id
                    );

                    const test = getTest(
                      booking.test_id
                    );

                    return (
                      <div
                        className="centre-item"
                        key={booking.id}
                      >
                        <h3>
                          {test?.name ||
                            "Diagnostic Test"}
                        </h3>

                        <p>
                          🏥{" "}
                          {centre?.name ||
                            "Diagnostic Centre"}
                        </p>

                        <p>
                          📅{" "}
                          {new Date(
                            booking.appointment_at
                          ).toLocaleString()}
                        </p>

                        <p>
                          💰 ₹
                          {Number(
                            booking.amount
                          ).toFixed(2)}
                        </p>

                        <div>
                          <strong>
                            Status:
                          </strong>{" "}
                          <span
                            className={getStatusClass(
                              booking.status
                            )}
                          >
                            {booking.status}
                          </span>
                        </div>

                        {booking.status ===
                          "PENDING" && (
                          <div className="payment-actions">
                            <button
                              type="button"
                              onClick={() =>
                                handlePayment(
                                  booking.id,
                                  "SUCCESS"
                                )
                              }
                              disabled={
                                paymentLoading ===
                                  booking.id ||
                                cancelLoading ===
                                  booking.id
                              }
                            >
                              {paymentLoading ===
                              booking.id
                                ? "Processing..."
                                : "Pay Now"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handlePayment(
                                  booking.id,
                                  "FAILED"
                                )
                              }
                              disabled={
                                paymentLoading ===
                                  booking.id ||
                                cancelLoading ===
                                  booking.id
                              }
                            >
                              Simulate Failed Payment
                            </button>

                            <button
                              type="button"
                              className="cancel-button"
                              onClick={() =>
                                handleCancelBooking(
                                  booking.id
                                )
                              }
                              disabled={
                                paymentLoading ===
                                  booking.id ||
                                cancelLoading ===
                                  booking.id
                              }
                            >
                              {cancelLoading ===
                              booking.id
                                ? "Cancelling..."
                                : "Cancel Booking"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;