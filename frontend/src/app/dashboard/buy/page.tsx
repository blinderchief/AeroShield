"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import {
  Plane,
  Calendar,
  Clock,
  Shield,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Info,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useApi } from "@/lib/api";

interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  details: string;
  impact: string;
}

interface Quote {
  premium_amount: number;
  coverage_amount: number;
  ai_risk_score: number;
  ai_delay_probability: number;
  risk_factors: {
    factors: RiskFactor[];
    weather: string;
    historical: string;
  };
}

const AIRLINES = [
  { code: "6E", name: "IndiGo" },
  { code: "AI", name: "Air India" },
  { code: "UK", name: "Vistara" },
  { code: "SG", name: "SpiceJet" },
  { code: "I5", name: "AirAsia India" },
  { code: "G8", name: "Go First" },
];

const AIRPORTS = [
  { code: "DEL", name: "Delhi (Indira Gandhi)" },
  { code: "BOM", name: "Mumbai (Chhatrapati Shivaji)" },
  { code: "BLR", name: "Bangalore (Kempegowda)" },
  { code: "HYD", name: "Hyderabad (Rajiv Gandhi)" },
  { code: "MAA", name: "Chennai (Anna)" },
  { code: "CCU", name: "Kolkata (Netaji)" },
  { code: "GOI", name: "Goa (Dabolim)" },
  { code: "PNQ", name: "Pune (Lohegaon)" },
];

export default function BuyPolicyPage() {
  const router = useRouter();
  const { user } = useUser();
  const api = useApi();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);

  const [formData, setFormData] = useState({
    airline_code: "",
    flight_number: "",
    departure_airport: "",
    arrival_airport: "",
    scheduled_departure: "",
    scheduled_arrival: "",
    coverage_amount: 5000,
    delay_threshold_minutes: 120,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getQuote = async () => {
    setLoading(true);
    try {
      const response = await api.post("/policies/quote", {
        flight_number: formData.flight_number,
        airline_code: formData.airline_code,
        departure_airport: formData.departure_airport,
        arrival_airport: formData.arrival_airport,
        scheduled_departure: new Date(formData.scheduled_departure).toISOString(),
        coverage_amount: formData.coverage_amount,
        delay_threshold_minutes: formData.delay_threshold_minutes,
      });
      setQuote(response.data);
      setStep(2);
    } catch (error) {
      toast.error("Failed to get quote. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  const purchasePolicy = async () => {
    setLoading(true);
    try {
      const response = await api.post("/policies/buy", {
        ...formData,
        flight_number: formData.flight_number,
        airline_code: formData.airline_code,
        airline_name: AIRLINES.find((a) => a.code === formData.airline_code)?.name,
        scheduled_departure: new Date(formData.scheduled_departure).toISOString(),
        scheduled_arrival: new Date(formData.scheduled_arrival).toISOString(),
      });
      
      toast.success("Policy created successfully!");
      setStep(3);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/dashboard/policies/${response.data.id}`);
      }, 2000);
    } catch (error) {
      toast.error("Failed to purchase policy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRiskTierColor = (probability: number) => {
    if (probability < 0.3) return { bg: "bg-green-500/20", text: "text-green-400", label: "Low Risk" };
    if (probability < 0.6) return { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "Medium Risk" };
    return { bg: "bg-red-500/20", text: "text-red-400", label: "High Risk" };
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s
                    ? "bg-gradient-to-r from-aeroshield-primary to-aeroshield-secondary text-white"
                    : "bg-gray-800 text-gray-500"
                }`}
              >
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-20 md:w-32 h-1 mx-2 rounded transition-all ${
                    step > s ? "bg-aeroshield-primary" : "bg-gray-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Flight Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card-glass p-8"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aeroshield-primary to-aeroshield-secondary flex items-center justify-center">
                  <Plane className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Enter Flight Details</h2>
                  <p className="text-gray-400">Tell us about your flight</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Airline</label>
                  <select
                    name="airline_code"
                    value={formData.airline_code}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-aeroshield-primary"
                  >
                    <option value="">Select Airline</option>
                    {AIRLINES.map((airline) => (
                      <option key={airline.code} value={airline.code}>
                        {airline.code} - {airline.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Flight Number</label>
                  <input
                    type="text"
                    name="flight_number"
                    value={formData.flight_number}
                    onChange={handleInputChange}
                    placeholder="e.g., 542"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-aeroshield-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Departure Airport</label>
                  <select
                    name="departure_airport"
                    value={formData.departure_airport}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-aeroshield-primary"
                  >
                    <option value="">Select Airport</option>
                    {AIRPORTS.map((airport) => (
                      <option key={airport.code} value={airport.code}>
                        {airport.code} - {airport.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Arrival Airport</label>
                  <select
                    name="arrival_airport"
                    value={formData.arrival_airport}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-aeroshield-primary"
                  >
                    <option value="">Select Airport</option>
                    {AIRPORTS.map((airport) => (
                      <option key={airport.code} value={airport.code}>
                        {airport.code} - {airport.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Departure Date & Time</label>
                  <input
                    type="datetime-local"
                    name="scheduled_departure"
                    value={formData.scheduled_departure}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-aeroshield-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Arrival Date & Time</label>
                  <input
                    type="datetime-local"
                    name="scheduled_arrival"
                    value={formData.scheduled_arrival}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-aeroshield-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Coverage Amount (₹)
                  </label>
                  <input
                    type="range"
                    name="coverage_amount"
                    min="1000"
                    max="20000"
                    step="1000"
                    value={formData.coverage_amount}
                    onChange={handleInputChange}
                    className="w-full accent-aeroshield-primary"
                  />
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-500">₹1,000</span>
                    <span className="text-white font-semibold">₹{formData.coverage_amount.toLocaleString()}</span>
                    <span className="text-gray-500">₹20,000</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Delay Threshold (hours)
                  </label>
                  <select
                    name="delay_threshold_minutes"
                    value={formData.delay_threshold_minutes}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-aeroshield-primary"
                  >
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="180">3 hours</option>
                    <option value="240">4 hours</option>
                  </select>
                </div>
              </div>

              <button
                onClick={getQuote}
                disabled={
                  loading ||
                  !formData.airline_code ||
                  !formData.flight_number ||
                  !formData.departure_airport ||
                  !formData.arrival_airport ||
                  !formData.scheduled_departure
                }
                className="btn-primary w-full mt-8 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Getting AI Quote...
                  </>
                ) : (
                  <>
                    Get AI Quote
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Step 2: Review Quote */}
          {step === 2 && quote && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card-glass p-8"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aeroshield-primary to-aeroshield-secondary flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">AI Risk Assessment</h2>
                  <p className="text-gray-400">Review your personalized quote</p>
                </div>
              </div>

              {/* Risk Overview */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className={`p-6 rounded-xl ${getRiskTierColor(quote.ai_delay_probability).bg}`}>
                  <div className="text-sm text-gray-400 mb-1">Delay Probability</div>
                  <div className={`text-3xl font-bold ${getRiskTierColor(quote.ai_delay_probability).text}`}>
                    {Math.round(quote.ai_delay_probability * 100)}%
                  </div>
                  <div className={`text-sm ${getRiskTierColor(quote.ai_delay_probability).text}`}>
                    {getRiskTierColor(quote.ai_delay_probability).label}
                  </div>
                </div>
                
                <div className="p-6 rounded-xl bg-gray-800/50">
                  <div className="text-sm text-gray-400 mb-1">Coverage</div>
                  <div className="text-3xl font-bold text-white">
                    ₹{quote.coverage_amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formData.delay_threshold_minutes / 60}h+ delay
                  </div>
                </div>
                
                <div className="p-6 rounded-xl bg-gradient-to-br from-aeroshield-primary/20 to-aeroshield-secondary/20">
                  <div className="text-sm text-gray-400 mb-1">Premium</div>
                  <div className="text-3xl font-bold gradient-text">
                    ₹{quote.premium_amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    One-time payment
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">AI Insights</h3>
                <div className="space-y-3">
                  {quote.risk_factors.weather && (
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start space-x-3">
                      <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-blue-400">Weather Analysis</div>
                        <div className="text-gray-400 text-sm">{quote.risk_factors.weather}</div>
                      </div>
                    </div>
                  )}
                  {quote.risk_factors.historical && (
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-purple-400">Historical Analysis</div>
                        <div className="text-gray-400 text-sm">{quote.risk_factors.historical}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Risk Factors */}
              {quote.risk_factors.factors?.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Risk Factors</h3>
                  <div className="space-y-2">
                    {quote.risk_factors.factors.map((factor: RiskFactor, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50"
                      >
                        <span className="text-gray-300">{factor.name}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                factor.impact === "negative" ? "bg-red-500" : "bg-green-500"
                              }`}
                              style={{ width: `${factor.score * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500 w-12">
                            {Math.round(factor.score * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1 flex items-center justify-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </button>
                <button
                  onClick={purchasePolicy}
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Pay ₹{quote.premium_amount} & Protect
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-glass p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-green-400" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-white mb-4">You're Protected! 🎉</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Your flight is now covered. If there's a delay beyond your threshold,
                you'll receive an automatic payout.
              </p>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="btn-secondary"
                >
                  View Dashboard
                </button>
                <button
                  onClick={() => {
                    setStep(1);
                    setQuote(null);
                    setFormData({
                      airline_code: "",
                      flight_number: "",
                      departure_airport: "",
                      arrival_airport: "",
                      scheduled_departure: "",
                      scheduled_arrival: "",
                      coverage_amount: 5000,
                      delay_threshold_minutes: 120,
                    });
                  }}
                  className="btn-primary"
                >
                  Protect Another Flight
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}
