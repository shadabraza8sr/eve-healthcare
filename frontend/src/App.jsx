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
import BookingHistory from "./components/BookingHistory";
import DashboardStats from "./components/DashboardStats";
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

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] =
    useState(true);

  const [centres, setCentres] = useState([]);
  const [centreSearch, setCentreSearch] =
    useState("");
  const [centrePage, setCentrePage] = useState(1);
  const [centrePages, setCentrePages] = useState(1);

  const [tests, setTests] = useState([]);
  const [allTests, setAllTests] = useState([]);
  const [testSearch, setTestSearch] =
    useState("");
  const [testPage, setTestPage] = useState(1);
  const [testPages, setTestPages] = useState(1);

  const [centreTests, setCentreTests] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCentre, setSelectedCentre] =
    useState("");

  const [selectedTest, setSelectedTest] =
    useState("");

  const [appointmentAt, setAppointmentAt] =
    useState("");

  const [availabilityDate, setAvailabilityDate] =
    useState("");

  const [availabilitySlots, setAvailabilitySlots] =
    useState([]);

  const [
    availabilityLoading,
    setAvailabilityLoading,
  ] = useState(false);

  const [
    availabilityMessage,
    setAvailabilityMessage,
  ] = useState("");

  const [bookingMessage, setBookingMessage] =
    useState("");

  const [bookingLoading, setBookingLoading] =
    useState(false);

  const [bookings, setBookings] = useState([]);

  const [
    bookingsLoading,
    setBookingsLoading,
  ] = useState(true);

  const [bookingError, setBookingError] =
    useState("");

  const [
    paymentLoading,
    setPaymentLoading,
  ] = useState(null);

  const [
    paymentMessage,
    setPaymentMessage,
  ] = useState("");

  const [
    cancelLoading,
    setCancelLoading,
  ] = useState(null);

  const [
    cancelMessage,
    setCancelMessage,
  ] = useState("");


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response =
          await api.get("/auth/me");

        setProfile(response.data);
      } catch {
        // Backend may be unavailable during UI development.
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, []);


  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          centresResponse,
          testsResponse,
          allTestsResponse,
          centreTestsResponse,
        ] = await Promise.all([
          api.get("/centres/", {
            params: {
              search:
                centreSearch || undefined,
              page: centrePage,
              limit: 10,
            },
          }),

          api.get("/tests/", {
            params: {
              search:
                testSearch || undefined,
              page: testPage,
              limit: 10,
            },
          }),

          api.get("/tests/", {
            params: {
              page: 1,
              limit: 100,
            },
          }),

          api.get("/centre-tests/"),
        ]);

        const centresData =
          centresResponse.data;

        const testsData =
          testsResponse.data;

        const allTestsData =
          allTestsResponse.data;

        setCentres(
          centresData.items || []
        );

        setCentrePages(
          Math.max(
            1,
            centresData.pages || 1
          )
        );

        setTests(
          testsData.items || []
        );

        setTestPages(
          Math.max(
            1,
            testsData.pages || 1
          )
        );

        setAllTests(
          allTestsData.items || []
        );

        setCentreTests(
          centreTestsResponse.data || []
        );
      } catch {
        setError("API_UNAVAILABLE");

        setCentres([]);
        setTests([]);
        setAllTests([]);
        setCentreTests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [
    centreSearch,
    centrePage,
    testSearch,
    testPage,
  ]);


  useEffect(() => {
    const fetchBookings = async () => {
      setBookingsLoading(true);
      setBookingError("");

      try {
        const response =
          await api.get("/bookings/");

        setBookings(
          response.data || []
        );
      } catch {
        setBookingError(
          "BOOKINGS_UNAVAILABLE"
        );

        setBookings([]);
      } finally {
        setBookingsLoading(false);
      }
    };

    fetchBookings();
  }, []);


  const logout = () => {
    localStorage.removeItem(
      "access_token"
    );

    navigate("/");
  };


  const getCentre = (centreId) => {
    return centres.find(
      (centre) =>
        centre.id === centreId
    );
  };


  const getTest = (testId) => {
    return allTests.find(
      (test) =>
        test.id === testId
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


  const availableTests =
    centreTests.filter(
      (item) =>
        item.centre_id ===
        Number(selectedCentre)
    );


  const handleCentreChange = (event) => {
    setSelectedCentre(
      event.target.value
    );

    setSelectedTest("");

    setAvailabilityDate("");
    setAvailabilitySlots([]);
    setAvailabilityMessage("");
    setAppointmentAt("");
  };


  const handleCheckAvailability =
    async () => {
      if (
        !selectedCentre ||
        !availabilityDate
      ) {
        setAvailabilityMessage(
          "Please select a centre and date."
        );

        return;
      }

      setAvailabilityLoading(true);
      setAvailabilityMessage("");
      setAvailabilitySlots([]);
      setAppointmentAt("");

      try {
        const response =
          await api.get(
            `/availability/${selectedCentre}`,
            {
              params: {
                appointment_date:
                  availabilityDate,
              },
            }
          );

        setAvailabilitySlots(
          response.data.slots || []
        );

        if (
          !response.data.slots ||
          response.data.slots.length === 0
        ) {
          setAvailabilityMessage(
            "No appointment slots are available for this date."
          );
        }
      } catch (err) {
        setAvailabilityMessage(
          err.response?.data?.detail ||
            "Unable to check availability."
        );
      } finally {
        setAvailabilityLoading(false);
      }
    };


  const handleBooking = async (event) => {
    event.preventDefault();

    setBookingMessage("");

    if (!appointmentAt) {
      setBookingMessage(
        "Please select an available appointment slot."
      );

      return;
    }

    if (
      !selectedCentre ||
      !selectedTest
    ) {
      setBookingMessage(
        "Please select a centre and diagnostic test."
      );

      return;
    }

    setBookingLoading(true);

    try {
      await api.post("/bookings/", {
        centre_id:
          Number(selectedCentre),
        test_id:
          Number(selectedTest),
        appointment_at:
          appointmentAt,
      });

      setBookingMessage(
        "Booking created successfully."
      );

      const response =
        await api.get("/bookings/");

      setBookings(
        response.data || []
      );

      setSelectedCentre("");
      setSelectedTest("");
      setAvailabilityDate("");
      setAvailabilitySlots([]);
      setAvailabilityMessage("");
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


  const handlePayment = async (
    bookingId,
    result
  ) => {
    setPaymentMessage("");
    setPaymentLoading(bookingId);

    try {
      await api.post("/payments/", {
        booking_id: bookingId,
        result,
      });

      setPaymentMessage(
        result === "SUCCESS"
          ? "Payment successful. Booking confirmed."
          : "Payment failed. Booking marked as failed."
      );

      const response =
        await api.get("/bookings/");

      setBookings(
        response.data || []
      );
    } catch (err) {
      setPaymentMessage(
        err.response?.data?.detail ||
          "Unable to process payment"
      );
    } finally {
      setPaymentLoading(null);
    }
  };


  const handleCancelBooking =
    async (bookingId) => {
      setCancelMessage("");
      setCancelLoading(bookingId);

      try {
        await api.patch(
          `/bookings/${bookingId}/cancel`
        );

        setCancelMessage(
          "Booking cancelled successfully."
        );

        const response =
          await api.get("/bookings/");

        setBookings(
          response.data || []
        );
      } catch (err) {
        setCancelMessage(
          err.response?.data?.detail ||
            "Unable to cancel booking"
        );
      } finally {
        setCancelLoading(null);
      }
    };


  const scrollToBooking = (
    centreId = null
  ) => {
    if (centreId) {
      setSelectedCentre(
        String(centreId)
      );

      setSelectedTest("");
      setAvailabilityDate("");
      setAvailabilitySlots([]);
      setAvailabilityMessage("");
      setAppointmentAt("");
    }

    setTimeout(() => {
      document
        .getElementById(
          "booking-section"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };


  const getLowestPrice = (testId) => {
    const prices = centreTests
      .filter(
        (item) =>
          item.test_id === testId
      )
      .map((item) =>
        Number(item.price)
      )
      .filter((price) =>
        Number.isFinite(price)
      );

    if (prices.length === 0) {
      return null;
    }

    return Math.min(...prices);
  };


  const getCentreCount = (testId) => {
    return centreTests.filter(
      (item) =>
        item.test_id === testId
    ).length;
  };


  const today = new Date()
    .toISOString()
    .split("T")[0];


  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="brand">
          <span className="brand-icon">
            +
          </span>

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
          <p className="welcome-label">
            EVE HEALTHCARE
          </p>

          <h1>
            Your healthcare,
            <br />
            all in one place.
          </h1>

          <p>
            Find diagnostic centres, explore
            available tests, and manage your
            appointments with ease.
          </p>
        </section>


        <section className="profile-card">
          <div className="profile-main">
            <div className="profile-avatar">
              {profile?.email
                ? profile.email
                    .charAt(0)
                    .toUpperCase()
                : "U"}
            </div>

            <div>
              <p className="profile-label">
                SIGNED IN AS
              </p>

              <p className="profile-email">
                {profileLoading
                  ? "Loading profile..."
                  : profile?.email ||
                    "Patient"}
              </p>
            </div>
          </div>

          <div className="profile-meta">
            <span className="profile-id">
              Patient ID:{" "}
              {profile?.id || "—"}
            </span>

            <span className="profile-status">
              <span className="profile-status-dot"></span>
              Active
            </span>
          </div>
        </section>


        <DashboardStats
          bookings={bookings}
          allTests={allTests}
        />


        {error && (
          <div className="dashboard-notice">
            <span className="dashboard-notice-icon">
              ℹ
            </span>

            <div>
              <strong>
                Live data unavailable
              </strong>

              <p>
                Connect the healthcare API
                to load live centres, tests,
                and bookings.
              </p>
            </div>
          </div>
        )}


        {loading ? (
          <section className="dashboard-section loading-card">
            <div className="loading-spinner"></div>

            <span>
              Loading healthcare services...
            </span>
          </section>
        ) : (
          <>
            <section className="dashboard-section">
              <div className="section-heading">
                <div>
                  <p className="section-eyebrow">
                    FIND CARE
                  </p>

                  <div className="section-title-row">
                    <div className="section-icon">
                      🏥
                    </div>

                    <div>
                      <h2>
                        Diagnostic Centres
                      </h2>

                      <p>
                        Choose a centre convenient
                        for your appointment.
                      </p>
                    </div>
                  </div>
                </div>

                <span className="section-count">
                  {centres.length} centres
                </span>
              </div>


              <div className="search-row">
                <input
                  type="text"
                  placeholder="Search centres by name or location..."
                  value={centreSearch}
                  onChange={(event) => {
                    setCentreSearch(
                      event.target.value
                    );

                    setCentrePage(1);
                  }}
                />
              </div>


              {centres.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    🏥
                  </div>

                  <h3>
                    No diagnostic centres available
                  </h3>

                  <p>
                    Centre information will appear
                    here when the healthcare API is
                    connected.
                  </p>
                </div>
              ) : (
                <div className="centre-list">
                  {centres.map(
                    (centre, index) => (
                      <article
                        className="centre-item"
                        key={centre.id}
                      >
                        <div className="item-card-top">
                          <div className="item-number">
                            {String(
                              index + 1
                            ).padStart(2, "0")}
                          </div>

                          <span className="item-location">
                            📍{" "}
                            {centre.location}
                          </span>
                        </div>

                        <h3>
                          {centre.name}
                        </h3>

                        <p>
                          🕒{" "}
                          {centre.opening_time}{" "}
                          –{" "}
                          {centre.closing_time}
                        </p>

                        <button
                          type="button"
                          className="item-action"
                          onClick={() =>
                            scrollToBooking(
                              centre.id
                            )
                          }
                        >
                          Book here →
                        </button>
                      </article>
                    )
                  )}
                </div>
              )}


              <div className="pagination">
                <button
                  type="button"
                  onClick={() =>
                    setCentrePage(
                      (page) =>
                        Math.max(
                          1,
                          page - 1
                        )
                    )
                  }
                  disabled={
                    centrePage === 1
                  }
                >
                  Previous
                </button>

                <span>
                  Page {centrePage} of{" "}
                  {centrePages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCentrePage(
                      (page) =>
                        Math.min(
                          centrePages,
                          page + 1
                        )
                    )
                  }
                  disabled={
                    centrePage >=
                    centrePages
                  }
                >
                  Next
                </button>
              </div>
            </section>


            <section className="dashboard-section">
              <div className="section-heading">
                <div>
                  <p className="section-eyebrow">
                    DIAGNOSTICS
                  </p>

                  <div className="section-title-row">
                    <div className="section-icon">
                      🧪
                    </div>

                    <div>
                      <h2>
                        Available Tests
                      </h2>

                      <p>
                        Explore diagnostic tests
                        and their centre pricing.
                      </p>
                    </div>
                  </div>
                </div>

                <span className="section-count">
                  {allTests.length} tests
                </span>
              </div>


              <div className="search-row">
                <input
                  type="text"
                  placeholder="Search diagnostic tests..."
                  value={testSearch}
                  onChange={(event) => {
                    setTestSearch(
                      event.target.value
                    );

                    setTestPage(1);
                  }}
                />
              </div>


              {tests.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    🧪
                  </div>

                  <h3>
                    No diagnostic tests available
                  </h3>

                  <p>
                    Available tests will appear
                    here when the healthcare API
                    is connected.
                  </p>
                </div>
              ) : (
                <div className="centre-list">
                  {tests.map(
                    (test, index) => {
                      const lowestPrice =
                        getLowestPrice(
                          test.id
                        );

                      const centreCount =
                        getCentreCount(
                          test.id
                        );

                      return (
                        <article
                          className="centre-item"
                          key={test.id}
                        >
                          <div className="item-card-top">
                            <div className="item-number">
                              {String(
                                index + 1
                              ).padStart(
                                2,
                                "0"
                              )}
                            </div>

                            <span className="item-location">
                              🏥{" "}
                              {centreCount}{" "}
                              {centreCount ===
                              1
                                ? "centre"
                                : "centres"}
                            </span>
                          </div>

                          <h3>
                            {test.name}
                          </h3>

                          <p>
                            {test.description ||
                              "Diagnostic test"}
                          </p>

                          <div className="test-footer">
                            <div className="price-label">
                              Starting from

                              <strong>
                                {lowestPrice !==
                                null
                                  ? `₹${lowestPrice.toFixed(
                                      2
                                    )}`
                                  : "Price unavailable"}
                              </strong>
                            </div>

                            <button
                              type="button"
                              className="item-action"
                              onClick={() =>
                                scrollToBooking()
                              }
                            >
                              Book test →
                            </button>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              )}


              <div className="pagination">
                <button
                  type="button"
                  onClick={() =>
                    setTestPage(
                      (page) =>
                        Math.max(
                          1,
                          page - 1
                        )
                    )
                  }
                  disabled={
                    testPage === 1
                  }
                >
                  Previous
                </button>

                <span>
                  Page {testPage} of{" "}
                  {testPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setTestPage(
                      (page) =>
                        Math.min(
                          testPages,
                          page + 1
                        )
                    )
                  }
                  disabled={
                    testPage >=
                    testPages
                  }
                >
                  Next
                </button>
              </div>
            </section>


            <section
              id="booking-section"
              className="dashboard-section booking-panel"
            >
              <div className="booking-panel-header">
                <div className="booking-panel-icon">
                  📅
                </div>

                <div>
                  <p className="section-eyebrow">
                    APPOINTMENT
                  </p>

                  <h2>
                    Book a Diagnostic Test
                  </h2>

                  <p>
                    Select a centre, test, date,
                    and available appointment slot.
                  </p>
                </div>
              </div>


              {bookingMessage && (
                <div className="booking-message">
                  {bookingMessage}
                </div>
              )}


              <form onSubmit={handleBooking}>
                <label htmlFor="booking-centre">
                  Diagnostic Centre
                </label>

                <select
                  id="booking-centre"
                  value={selectedCentre}
                  onChange={
                    handleCentreChange
                  }
                  required
                >
                  <option value="">
                    Select a diagnostic centre
                  </option>

                  {centres.map(
                    (centre) => (
                      <option
                        key={centre.id}
                        value={centre.id}
                      >
                        {centre.name} —{" "}
                        {centre.location}
                      </option>
                    )
                  )}
                </select>


                <label htmlFor="booking-test">
                  Diagnostic Test
                </label>

                <select
                  id="booking-test"
                  value={selectedTest}
                  onChange={(event) =>
                    setSelectedTest(
                      event.target.value
                    )
                  }
                  required
                  disabled={
                    !selectedCentre
                  }
                >
                  <option value="">
                    {selectedCentre
                      ? "Select a diagnostic test"
                      : "Select a centre first"}
                  </option>

                  {availableTests.map(
                    (item) => {
                      const test =
                        getTest(
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
                          {test.name} — ₹
                          {Number(
                            item.price
                          ).toFixed(2)}
                        </option>
                      );
                    }
                  )}
                </select>


                <label htmlFor="booking-date">
                  Appointment Date
                </label>

                <input
                  id="booking-date"
                  type="date"
                  value={
                    availabilityDate
                  }
                  onChange={(event) => {
                    setAvailabilityDate(
                      event.target.value
                    );

                    setAppointmentAt(
                      ""
                    );

                    setAvailabilitySlots(
                      []
                    );

                    setAvailabilityMessage(
                      ""
                    );
                  }}
                  min={today}
                  required
                />


                <button
                  type="button"
                  onClick={
                    handleCheckAvailability
                  }
                  disabled={
                    availabilityLoading ||
                    !selectedCentre ||
                    !availabilityDate
                  }
                >
                  {availabilityLoading
                    ? "Checking availability..."
                    : "Check availability"}
                </button>


                {availabilityMessage && (
                  <div className="booking-message">
                    {availabilityMessage}
                  </div>
                )}


                {availabilitySlots.length >
                  0 && (
                  <div className="slot-section">
                    <div className="slot-header">
                      <strong>
                        Available appointment slots
                      </strong>

                      <span>
                        Select one slot
                      </span>
                    </div>

                    <div className="availability-slots">
                      {availabilitySlots.map(
                        (slot) => {
                          const slotDate =
                            new Date(
                              slot.appointment_at
                            );

                          const timeLabel =
                            slotDate.toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute:
                                  "2-digit",
                              }
                            );

                          const selected =
                            appointmentAt ===
                            slot.appointment_at.slice(
                              0,
                              16
                            );

                          return (
                            <button
                              type="button"
                              key={
                                slot.appointment_at
                              }
                              className={
                                !slot.available
                                  ? "slot-button slot-booked"
                                  : selected
                                    ? "slot-button slot-selected"
                                    : "slot-button"
                              }
                              disabled={
                                !slot.available
                              }
                              onClick={() => {
                                if (
                                  slot.available
                                ) {
                                  setAppointmentAt(
                                    slot.appointment_at.slice(
                                      0,
                                      16
                                    )
                                  );
                                }
                              }}
                            >
                              {timeLabel}

                              {!slot.available &&
                                " · Booked"}
                            </button>
                          );
                        }
                      )}
                    </div>

                    {appointmentAt && (
                      <p className="selected-slot">
                        Selected appointment:{" "}
                        {new Date(
                          appointmentAt
                        ).toLocaleString(
                          "en-IN",
                          {
                            dateStyle:
                              "medium",
                            timeStyle:
                              "short",
                          }
                        )}
                      </p>
                    )}
                  </div>
                )}


                <button
                  type="submit"
                  className="booking-submit"
                  disabled={
                    bookingLoading ||
                    !selectedCentre ||
                    !selectedTest ||
                    !appointmentAt
                  }
                >
                  {bookingLoading
                    ? "Creating booking..."
                    : "Confirm booking"}
                </button>
              </form>
            </section>


            <BookingHistory
              bookings={bookings}
              bookingsLoading={
                bookingsLoading
              }
              bookingError={
                bookingError
              }
              paymentMessage={
                paymentMessage
              }
              cancelMessage={
                cancelMessage
              }
              paymentLoading={
                paymentLoading
              }
              cancelLoading={
                cancelLoading
              }
              getCentre={getCentre}
              getTest={getTest}
              getStatusClass={
                getStatusClass
              }
              handlePayment={
                handlePayment
              }
              handleCancelBooking={
                handleCancelBooking
              }
            />
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