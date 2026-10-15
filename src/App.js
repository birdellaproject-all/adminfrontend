import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import AdminLayout from "./layouts/AdminLayout";

import ExecutiveCommand from "./pages/ExecutiveCommand";
import MyWorkDashboard from "./pages/MyWorkDashboard";
import ApprovalCenter from "./pages/ApprovalCenter";
import OperationsInbox from "./pages/OperationsInbox";
import LiveIncidents from "./pages/LiveIncidents";
import ServiceHealth from "./pages/ServiceHealth";
import ChangeCalendar from "./pages/ChangeCalendar";
import ShiftHandovers from "./pages/ShiftHandovers";
import Postmortems from "./pages/Postmortems";
import SituationReports from "./pages/SituationReports";
import PortfolioOverview from "./pages/PortfolioOverview";
import Flights from "./pages/Flights";
import Stays from "./pages/Stays";
import Visa from "./pages/Visa";
import Insurance from "./pages/Insurance";
import Trains from "./pages/Trains";

// ---- Bus module ----
import BusesLayout from "./pages/bus/BusesLayout";
import CommandDashboard from "./pages/bus/CommandDashboard";
import Bookings from "./pages/bus/Bookings";
import VendorControl from "./pages/bus/VendorControl";
import ChangeApproval from "./pages/bus/ChangeApproval";
import BusesList from "./pages/bus/BusesList";
import ApiMapping from "./pages/bus/ApiMapping";
import RoutesStops from "./pages/bus/RoutesStops";
import PricingSeats from "./pages/bus/PricingSeats";
import ProductContent from "./pages/bus/ProductContent";
import OperationsMisc from "./pages/bus/OperationsMisc";

// ---- Cab module ----
import CabsLayout from "./pages/cab/CabsLayout";
import CabCommandDashboard from "./pages/cab/CommandDashboard";
import CabBookings from "./pages/cab/Bookings";
import CabList from "./pages/cab/CabList";
import CabDrivers from "./pages/cab/Drivers";
import CabCancellation from "./pages/cab/Cancellation";
import CabPromotions from "./pages/cab/Promotions";
import CabReviews from "./pages/cab/Reviews";
import CabApiMapping from "./pages/cab/ApiMapping";
import CabWebhookReplay from "./pages/cab/WebhookReplay";
import CabReports from "./pages/cab/Reports";
import CabVehicles from "./pages/cab/Vehicles";
import CabFareRules from "./pages/cab/FareRules";
import CabProductInfo from "./pages/cab/ProductInfo";
import CabPlaceholder from "./pages/cab/Placeholder";

function isAdminLoggedIn() {
  return (
    localStorage.getItem("bmtRole") === "admin" &&
    Boolean(localStorage.getItem("bmtAdminToken"))
  );
}
function AdminGuard({ children }) {
  return isAdminLoggedIn() ? children : <Navigate to="/" replace />;
}
function GuestOnly({ children }) {
  return isAdminLoggedIn() ? <Navigate to="/admin" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GuestOnly><Login /></GuestOnly>} />

        <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
          {/* Existing admin routes */}
          <Route index element={<ExecutiveCommand />} />
          <Route path="executive" element={<ExecutiveCommand />} />
          <Route path="my-work" element={<MyWorkDashboard />} />
          <Route path="approvals" element={<ApprovalCenter />} />
          <Route path="inbox" element={<OperationsInbox />} />
          <Route path="incidents" element={<LiveIncidents />} />
          <Route path="service-health" element={<ServiceHealth />} />
          <Route path="change-calendar" element={<ChangeCalendar />} />
          <Route path="handovers" element={<ShiftHandovers />} />
          <Route path="postmortems" element={<Postmortems />} />
          <Route path="reports" element={<SituationReports />} />
          <Route path="portfolio" element={<PortfolioOverview />} />
          <Route path="flights" element={<Flights />} />
          <Route path="stays" element={<Stays />} />
          <Route path="visa" element={<Visa />} />
          <Route path="insurance" element={<Insurance />} />
          <Route path="trains" element={<Trains />} />

          {/* ---- BUSES ---- */}
          <Route path="buses" element={<BusesLayout />}>
            <Route index element={<CommandDashboard />} />

            {/* Vendor screens — reuse VendorControl */}
            <Route path="vendor-360" element={<VendorControl />} />
            <Route path="vendor-onboarding" element={<VendorControl />} />
            <Route path="vendor-products" element={<VendorControl />} />
            <Route path="vendor-inventory" element={<VendorControl />} />
            <Route path="vendor-bookings" element={<VendorControl />} />
            <Route path="vendor-access" element={<VendorControl />} />
            <Route path="vendor-compliance" element={<VendorControl />} />
            <Route path="admin-supply" element={<VendorControl />} />
            <Route path="commercial" element={<VendorControl />} />
            <Route path="source-mapping" element={<VendorControl />} />
            <Route path="provider-cert" element={<VendorControl />} />
            <Route path="provider-cost" element={<VendorControl />} />

            {/* Built bus pages */}
            <Route path="bookings" element={<Bookings />} />
            <Route path="change-approval" element={<ChangeApproval />} />
            <Route path="list" element={<BusesList />} />
            <Route path="api-mapping" element={<ApiMapping />} />

            {/* Routes / Stops / Boarding / Drop */}
            <Route path="routes" element={<RoutesStops />} />
            <Route path="stops" element={<RoutesStops />} />
            <Route path="boarding-points" element={<RoutesStops />} />
            <Route path="drop-points" element={<RoutesStops />} />

            {/* Pricing / Seats */}
            <Route path="seat-pricing" element={<PricingSeats />} />
            <Route path="seat-inventory" element={<PricingSeats />} />

            {/* Product content */}
            <Route path="product-information" element={<ProductContent />} />
            <Route path="amenities" element={<ProductContent />} />
            <Route path="product-reviews" element={<ProductContent />} />
            <Route path="photos-media" element={<ProductContent />} />
            <Route path="policies" element={<ProductContent />} />
            <Route path="product-documents" element={<ProductContent />} />
            <Route path="product-change-history" element={<ProductContent />} />

            {/* Operations misc */}
            <Route path="cancellation" element={<OperationsMisc />} />
            <Route path="promotions" element={<OperationsMisc />} />
            <Route path="reviews" element={<OperationsMisc />} />
            <Route path="webhook-replay" element={<OperationsMisc />} />
            <Route path="reports" element={<OperationsMisc />} />
          </Route>

          {/* ---- CABS ---- */}
          <Route path="cabs" element={<CabsLayout />}>
            <Route index element={<CabCommandDashboard />} />

            {/* Vendor screens — placeholder */}
            <Route path="vendor-360" element={<CabPlaceholder title="Vendor 360° control" />} />
            <Route path="vendor-onboarding" element={<CabPlaceholder title="Vendor onboarding & KYC" />} />
            <Route path="vendor-products" element={<CabPlaceholder title="Vendor products & listings" />} />
            <Route path="vendor-inventory" element={<CabPlaceholder title="Vendor inventory & rates" />} />
            <Route path="vendor-bookings" element={<CabPlaceholder title="Vendor bookings & servicing" />} />
            <Route path="vendor-access" element={<CabPlaceholder title="Vendor access & security" />} />
            <Route path="vendor-compliance" element={<CabPlaceholder title="Vendor compliance & audit" />} />
            <Route path="change-approval" element={<CabPlaceholder title="Change approval queue" />} />
            <Route path="admin-supply" element={<CabPlaceholder title="Admin supply override" />} />
            <Route path="commercial" element={<CabPlaceholder title="Commercial & settlement control" />} />
            <Route path="source-mapping" element={<CabPlaceholder title="Source mapping & priority" />} />
            <Route path="provider-cert" element={<CabPlaceholder title="Provider certification" />} />
            <Route path="provider-cost" element={<CabPlaceholder title="Provider cost & quota" />} />

            {/* Operations */}
            <Route path="owner-onboarding" element={<CabPlaceholder title="Owner onboarding" />} />
            <Route path="drivers" element={<CabDrivers />} />
            <Route path="nearby-requests" element={<CabPlaceholder title="Nearby requests" />} />
            <Route path="dispatch" element={<CabPlaceholder title="Dispatch board" />} />
            <Route path="live-fleet" element={<CabPlaceholder title="Live fleet map" />} />
            <Route path="live-trips" element={<CabPlaceholder title="Live trips" />} />
            <Route path="safety" element={<CabPlaceholder title="Safety & SOS" />} />
            <Route path="earnings" element={<CabPlaceholder title="Earnings & payouts" />} />
            <Route path="fleet-companies" element={<CabPlaceholder title="Fleet companies" />} />
            <Route path="independent-owners" element={<CabPlaceholder title="Independent owners" />} />
            <Route path="driver-kyc" element={<CabPlaceholder title="Driver KYC" />} />
            <Route path="documents" element={<CabPlaceholder title="Documents" />} />
            <Route path="shifts" element={<CabPlaceholder title="Shifts" />} />
            <Route path="surge" element={<CabPlaceholder title="Surge controls" />} />
            <Route path="zones" element={<CabPlaceholder title="Zones & airports" />} />
            <Route path="pickup-otp" element={<CabPlaceholder title="Pickup OTP" />} />
            <Route path="driver-app" element={<CabPlaceholder title="Driver app control" />} />
            <Route path="bookings" element={<CabBookings />} />
            <Route path="cancellation" element={<CabCancellation />} />
            <Route path="promotions" element={<CabPromotions />} />
            <Route path="reviews" element={<CabReviews />} />
            <Route path="api-mapping" element={<CabApiMapping />} />
            <Route path="webhook-replay" element={<CabWebhookReplay />} />
            <Route path="reports" element={<CabReports />} />

            {/* Product setup & content */}
            <Route path="vehicles" element={<CabVehicles />} />
            <Route path="fare-rules" element={<CabFareRules />} />
            <Route path="product-information" element={<CabProductInfo />} />
            <Route path="product-rates" element={<CabPlaceholder title="Product rates" />} />
            <Route path="product-availability" element={<CabPlaceholder title="Product availability" />} />
            <Route path="amenities" element={<CabPlaceholder title="Amenities & inclusions" />} />
            <Route path="product-reviews" element={<CabPlaceholder title="Product reviews" />} />
            <Route path="photos-media" element={<CabPlaceholder title="Photos & media" />} />
            <Route path="product-documents" element={<CabPlaceholder title="Product documents" />} />
            <Route path="product-change-history" element={<CabPlaceholder title="Product change history" />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}