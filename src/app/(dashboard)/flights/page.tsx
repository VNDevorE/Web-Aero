"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Plane,
    Plus,
    Clock,
    MapPin,
    Users,
    CheckCircle,
    AlertTriangle,
    Truck,
    X,
    Send,
    Navigation,
    ArrowRight,
    ArrowLeft,
    Disc,
    Flame,
    Wind,
    Car,
    RotateCcw,
    Siren,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { FlightTimer } from "@/components/ui/flight-timer";
import { AIRPORTS } from "@/lib/constants";
import { createNotification } from "@/lib/notifications";

type FlightStatus = "IN_FLIGHT" | "LANDED" | "EMERGENCY" | "REQUESTING_GROUND_CREW";
type EmergencyType = "LANDING_GEAR" | "ENGINE_EXPLOSION" | "WING_CONTROL";
type GroundCrewRequest = "FOLLOW_ME" | "PUSHBACK" | "FIRE_TRUCK";
type ModalView = "main" | "emergency" | "groundcrew";

interface Flight {
    id: string;
    flightNumber: string;
    airline: string;
    departureAirport: string;
    arrivalAirport: string;
    aircraftType: string;
    captain: string;
    captainId: string;
    firstOfficer: string;
    gate: string;
    declaredAt: Date;
    status: FlightStatus;
    emergencyType?: EmergencyType;
    groundCrewRequest?: GroundCrewRequest;
}

// Serializable flight interface for localStorage
interface SerializedFlight extends Omit<Flight, 'declaredAt'> {
    declaredAt: string;
}

// Mock active flights (other pilots)
const mockFlights: Flight[] = [
    {
        id: "1",
        flightNumber: "AF123",
        airline: "Air France",
        departureAirport: "ITKO",
        arrivalAirport: "IPPH",
        aircraftType: "A350",
        captain: "DevorE",
        captainId: "other-user-1",
        firstOfficer: "John Doe",
        gate: "A12",
        declaredAt: new Date(Date.now() - 45 * 60 * 1000),
        status: "IN_FLIGHT",
    },
    {
        id: "2",
        flightNumber: "DHL456",
        airline: "DHL",
        departureAirport: "IRFD",
        arrivalAirport: "ILAR",
        aircraftType: "Boeing 777",
        captain: "Pilot2",
        captainId: "other-user-2",
        firstOfficer: "",
        gate: "C5",
        declaredAt: new Date(Date.now() - 20 * 60 * 1000),
        status: "IN_FLIGHT",
    },
];

// Airlines will be fetched from database

// Helper function to get user-specific storage key
const getStorageKey = (userId: string) => `aero_active_flight_${userId}`;

export default function FlightsPage() {
    const { data: session, status } = useSession();
    const currentUserId = session?.user?.id || "";

    const [flights, setFlights] = useState<Flight[]>(mockFlights);
    const [myActiveFlight, setMyActiveFlight] = useState<Flight | null>(null);
    const [showFlightControl, setShowFlightControl] = useState(false);
    const [modalView, setModalView] = useState<ModalView>("main");
    const [isLoaded, setIsLoaded] = useState(false);
    const [airlines, setAirlines] = useState<{ id: string; name: string }[]>([]);
    const [airlineFleet, setAirlineFleet] = useState<{ id: string; aircraft_name: string }[]>([]);
    const [loadingFleet, setLoadingFleet] = useState(false);

    // Fetch airlines from database
    useEffect(() => {
        async function fetchAirlines() {
            try {
                const res = await fetch('/api/airlines');
                const data = await res.json();
                if (data.airlines) {
                    setAirlines(data.airlines);
                }
            } catch (e) {
                console.error('Failed to fetch airlines:', e);
            }
        }
        fetchAirlines();
    }, []);

    // Fetch fleet when airline is selected
    const fetchFleet = async (airlineId: string) => {
        if (!airlineId) {
            setAirlineFleet([]);
            return;
        }
        setLoadingFleet(true);
        try {
            const res = await fetch(`/api/airlines/fleet?airlineId=${airlineId}`);
            const data = await res.json();
            setAirlineFleet(data.aircraft || []);
        } catch (e) {
            console.error('Failed to fetch fleet:', e);
            setAirlineFleet([]);
        }
        setLoadingFleet(false);
    };

    // Load active flight from localStorage on mount (only when session is ready)
    useEffect(() => {
        // Wait for session to be loaded
        if (status === "loading" || !currentUserId) {
            return;
        }

        try {
            const storageKey = getStorageKey(currentUserId);
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed: SerializedFlight = JSON.parse(saved);
                const flight: Flight = {
                    ...parsed,
                    declaredAt: new Date(parsed.declaredAt),
                };

                // CRITICAL: Verify this flight belongs to current user
                if (flight.captainId !== currentUserId) {
                    localStorage.removeItem(storageKey);
                    setIsLoaded(true);
                    return;
                }

                // Only restore if still in flight
                if (flight.status === "IN_FLIGHT" || flight.status === "EMERGENCY" || flight.status === "REQUESTING_GROUND_CREW") {
                    setMyActiveFlight(flight);
                    setShowFlightControl(true);
                    // Add to flights list if not already there
                    setFlights(prev => {
                        if (prev.some(f => f.id === flight.id)) return prev;
                        return [flight, ...prev];
                    });
                } else {
                    localStorage.removeItem(storageKey);
                }
            }
        } catch (e) {
            console.error("Failed to load active flight:", e);
        }
        setIsLoaded(true);
    }, [currentUserId, status]);

    // Save active flight to localStorage when it changes
    useEffect(() => {
        if (!isLoaded || !currentUserId) return;

        const storageKey = getStorageKey(currentUserId);

        if (myActiveFlight) {
            // Double-check ownership before saving
            if (myActiveFlight.captainId !== currentUserId) {
                console.error("Attempted to save flight that doesn't belong to current user");
                return;
            }

            const toSave: SerializedFlight = {
                ...myActiveFlight,
                declaredAt: myActiveFlight.declaredAt.toISOString(),
            };
            localStorage.setItem(storageKey, JSON.stringify(toSave));
        } else {
            localStorage.removeItem(storageKey);
        }
    }, [myActiveFlight, isLoaded, currentUserId]);

    // Form state
    const [formData, setFormData] = useState({
        airline: "",
        flightNumber: "",
        gate: "",
        aircraftType: "",
        departureAirport: "",
        arrivalAirport: "",
        captain: session?.user?.name || "",
        firstOfficer: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newFlight: Flight = {
            id: Date.now().toString(),
            ...formData,
            captainId: currentUserId,
            declaredAt: new Date(),
            status: "IN_FLIGHT" as const,
        };

        setFlights([newFlight, ...flights]);
        setMyActiveFlight(newFlight);
        setShowFlightControl(true);
        setFormData({
            airline: "",
            flightNumber: "",
            gate: "",
            aircraftType: "",
            departureAirport: "",
            arrivalAirport: "",
            captain: session?.user?.name || "",
            firstOfficer: "",
        });
    };

    const handleStatusChange = (newStatus: FlightStatus) => {
        if (!myActiveFlight) return;

        setFlights(
            flights.map((f) => (f.id === myActiveFlight.id ? { ...f, status: newStatus } : f))
        );
        setMyActiveFlight({ ...myActiveFlight, status: newStatus });

        if (newStatus === "LANDED") {
            setShowFlightControl(false);
            setMyActiveFlight(null);
            setModalView("main");
        }
    };

    // Handle emergency with specific type
    const handleEmergency = (emergencyType: EmergencyType) => {
        if (!myActiveFlight) return;

        const updatedFlight = {
            ...myActiveFlight,
            status: "EMERGENCY" as FlightStatus,
            emergencyType,
        };

        setFlights(
            flights.map((f) => (f.id === myActiveFlight.id ? updatedFlight : f))
        );
        setMyActiveFlight(updatedFlight);
        setModalView("main");

        // Send notification to ATC + Ground Crew panels
        createNotification({
            flightId: myActiveFlight.id,
            flightNumber: myActiveFlight.flightNumber,
            airline: myActiveFlight.airline,
            captain: myActiveFlight.captain,
            captainId: myActiveFlight.captainId,
            route: `${myActiveFlight.departureAirport} → ${myActiveFlight.arrivalAirport}`,
            type: "EMERGENCY",
            subType: emergencyType,
        });
    };

    // Handle ground crew request with specific type
    const handleGroundCrewRequest = (requestType: GroundCrewRequest) => {
        if (!myActiveFlight) return;

        const updatedFlight = {
            ...myActiveFlight,
            status: "REQUESTING_GROUND_CREW" as FlightStatus,
            groundCrewRequest: requestType,
        };

        setFlights(
            flights.map((f) => (f.id === myActiveFlight.id ? updatedFlight : f))
        );
        setMyActiveFlight(updatedFlight);
        setModalView("main");

        // Send notification to Ground Crew (and ATC for fire truck)
        createNotification({
            flightId: myActiveFlight.id,
            flightNumber: myActiveFlight.flightNumber,
            airline: myActiveFlight.airline,
            captain: myActiveFlight.captain,
            captainId: myActiveFlight.captainId,
            route: `${myActiveFlight.departureAirport} → ${myActiveFlight.arrivalAirport}`,
            type: "GROUND_CREW_REQUEST",
            subType: requestType,
        });
    };

    // Get emergency type label in Vietnamese
    const getEmergencyLabel = (type: EmergencyType) => {
        switch (type) {
            case "LANDING_GEAR": return "Gãy càng đáp";
            case "ENGINE_EXPLOSION": return "Nổ động cơ";
            case "WING_CONTROL": return "Hỏng điều khiển cánh";
        }
    };

    // Get ground crew request label in Vietnamese
    const getGroundCrewLabel = (type: GroundCrewRequest) => {
        switch (type) {
            case "FOLLOW_ME": return "Xe Follow Me";
            case "PUSHBACK": return "Pushback";
            case "FIRE_TRUCK": return "Xe cứu hỏa";
        }
    };

    // Get selected airport names
    const getAirportName = (code: string) => {
        const airport = AIRPORTS.find(a => a.code === code);
        return airport?.name || code;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Flight Control Modal - Only for current user's flight */}
            {showFlightControl && myActiveFlight && (
                <div className="fixed top-0 left-0 w-screen h-screen z-[100] flex items-center justify-center overflow-hidden">
                    {/* Full-screen backdrop */}
                    <div className="fixed top-0 left-0 w-screen h-screen bg-black/80 backdrop-blur-md" onClick={() => setShowFlightControl(false)} />
                    {/* Modal content */}
                    <div className="relative w-full max-w-3xl mx-4 p-8 rounded-2xl bg-gray-900/95 border border-white/10 shadow-2xl shadow-cyan-500/10 animate-scale-in">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 animate-pulse">
                                    <Plane className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        Chuyến bay của bạn
                                    </h2>
                                    <p className="text-cyan-400 text-sm flex items-center gap-1">
                                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                                        Đang hoạt động
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowFlightControl(false)}
                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Flight Info */}
                        <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 mb-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Số hiệu</p>
                                    <p className="text-xl font-bold text-white">{myActiveFlight.flightNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Hãng bay</p>
                                    <p className="text-xl font-bold text-cyan-400">{myActiveFlight.airline}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Hành trình</p>
                                    <p className="text-xl font-bold text-white flex items-center gap-1">
                                        {myActiveFlight.departureAirport}
                                        <ArrowRight className="w-4 h-4 text-cyan-400" />
                                        {myActiveFlight.arrivalAirport}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Thời gian bay</p>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-cyan-400" />
                                        <FlightTimer startTime={myActiveFlight.declaredAt} className="text-xl font-bold text-white" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Máy bay</p>
                                    <p className="text-sm text-white">{myActiveFlight.aircraftType}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Cổng</p>
                                    <p className="text-sm text-white">Gate {myActiveFlight.gate}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Cơ phó</p>
                                    <p className="text-sm text-white">{myActiveFlight.firstOfficer || "Không có"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons with Sub-menus */}
                        {myActiveFlight.status === "IN_FLIGHT" && (
                            <>
                                {/* Main View - 3 primary buttons */}
                                {modalView === "main" && (
                                    <div className="grid grid-cols-3 gap-4">
                                        <button
                                            onClick={() => handleStatusChange("LANDED")}
                                            className="flex flex-col items-center gap-3 p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all group"
                                        >
                                            <CheckCircle className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                            <span className="font-semibold text-lg">Đã hạ cánh</span>
                                        </button>
                                        <button
                                            onClick={() => setModalView("emergency")}
                                            className="flex flex-col items-center gap-3 p-5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all group"
                                        >
                                            <AlertTriangle className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                            <span className="font-semibold text-lg">Khẩn cấp</span>
                                        </button>
                                        <button
                                            onClick={() => setModalView("groundcrew")}
                                            className="flex flex-col items-center gap-3 p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all group"
                                        >
                                            <Truck className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                            <span className="font-semibold text-lg">Ground Crew</span>
                                        </button>
                                    </div>
                                )}

                                {/* Emergency Sub-menu */}
                                {modalView === "emergency" && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <AlertTriangle className="w-6 h-6 text-red-400" />
                                            <h3 className="text-lg font-semibold text-red-400">Chọn loại tình huống khẩn cấp</h3>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <button
                                                onClick={() => handleEmergency("LANDING_GEAR")}
                                                className="flex flex-col items-center gap-3 p-5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all group"
                                            >
                                                <Disc className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                                <span className="font-semibold">Gãy càng đáp</span>
                                            </button>
                                            <button
                                                onClick={() => handleEmergency("ENGINE_EXPLOSION")}
                                                className="flex flex-col items-center gap-3 p-5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all group"
                                            >
                                                <Flame className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                                <span className="font-semibold">Nổ động cơ</span>
                                            </button>
                                            <button
                                                onClick={() => handleEmergency("WING_CONTROL")}
                                                className="flex flex-col items-center gap-3 p-5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all group"
                                            >
                                                <Wind className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                                <span className="font-semibold">Hỏng điều khiển cánh</span>
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => setModalView("main")}
                                            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-800/50 border border-white/10 text-gray-400 hover:bg-gray-700/50 hover:text-white transition-all"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                            <span className="font-medium">Hủy - Quay lại</span>
                                        </button>
                                    </div>
                                )}

                                {/* Ground Crew Sub-menu */}
                                {modalView === "groundcrew" && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Truck className="w-6 h-6 text-amber-400" />
                                            <h3 className="text-lg font-semibold text-amber-400">Chọn dịch vụ Ground Crew</h3>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <button
                                                onClick={() => handleGroundCrewRequest("FOLLOW_ME")}
                                                className="flex flex-col items-center gap-3 p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all group"
                                            >
                                                <Car className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                                <span className="font-semibold">Xe Follow Me</span>
                                            </button>
                                            <button
                                                onClick={() => handleGroundCrewRequest("PUSHBACK")}
                                                className="flex flex-col items-center gap-3 p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all group"
                                            >
                                                <RotateCcw className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                                <span className="font-semibold">Pushback</span>
                                            </button>
                                            <button
                                                onClick={() => handleGroundCrewRequest("FIRE_TRUCK")}
                                                className="flex flex-col items-center gap-3 p-5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50 transition-all group"
                                            >
                                                <Siren className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                                <span className="font-semibold">Xe cứu hỏa</span>
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => setModalView("main")}
                                            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-800/50 border border-white/10 text-gray-400 hover:bg-gray-700/50 hover:text-white transition-all"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                            <span className="font-medium">Hủy - Quay lại</span>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Status badges for non-flying states */}
                        {myActiveFlight.status !== "IN_FLIGHT" && (
                            <div className="text-center space-y-4">
                                <span
                                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-base font-medium ${myActiveFlight.status === "EMERGENCY"
                                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                        }`}
                                >
                                    {myActiveFlight.status === "EMERGENCY" && (
                                        <>
                                            <AlertTriangle className="w-5 h-5" />
                                            {myActiveFlight.emergencyType
                                                ? getEmergencyLabel(myActiveFlight.emergencyType)
                                                : "Tình trạng khẩn cấp"}
                                        </>
                                    )}
                                    {myActiveFlight.status === "REQUESTING_GROUND_CREW" && (
                                        <>
                                            <Truck className="w-5 h-5" />
                                            {myActiveFlight.groundCrewRequest
                                                ? `Đang chờ: ${getGroundCrewLabel(myActiveFlight.groundCrewRequest)}`
                                                : "Đang chờ Ground Crew"}
                                        </>
                                    )}
                                </span>

                                {/* Return to main view button */}
                                <button
                                    onClick={() => {
                                        // Reset status back to IN_FLIGHT and clear emergency/ground crew data
                                        const resetFlight = {
                                            ...myActiveFlight,
                                            status: "IN_FLIGHT" as FlightStatus,
                                            emergencyType: undefined,
                                            groundCrewRequest: undefined,
                                        };
                                        setFlights(flights.map((f) => (f.id === myActiveFlight.id ? resetFlight : f)));
                                        setMyActiveFlight(resetFlight);
                                        setModalView("main");
                                    }}
                                    className="flex items-center justify-center gap-2 mx-auto px-6 py-3 rounded-xl bg-gray-500/10 border border-gray-500/30 text-gray-300 hover:bg-gray-500/20 hover:border-gray-500/50 transition-all cursor-pointer"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    <span className="font-medium">Kết thúc - Quay trở lại</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Plane className="w-7 h-7 text-cyan-400" />
                        Khai báo chuyến bay
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Quản lý và theo dõi các chuyến bay của bạn
                    </p>
                </div>
                {myActiveFlight && (
                    <GlowButton onClick={() => setShowFlightControl(true)}>
                        <Navigation className="w-4 h-4" />
                        Chuyến bay của tôi
                    </GlowButton>
                )}
            </div>

            {/* NEW: Always visible Flight Declaration Form with beautiful UI */}
            {!myActiveFlight && (
                <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-cyan-900/20">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative p-8">
                        {/* Form Header */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30">
                                <Send className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Khai báo chuyến bay mới</h2>
                                <p className="text-gray-400">Điền thông tin để bắt đầu chuyến bay của bạn</p>
                            </div>
                        </div>

                        {/* Route Preview */}
                        {formData.departureAirport && formData.arrivalAirport && (
                            <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center justify-center gap-8">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-white">{formData.departureAirport}</p>
                                        <p className="text-sm text-gray-400 mt-1">{getAirportName(formData.departureAirport)}</p>
                                    </div>
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                                        <Plane className="w-8 h-8 text-cyan-400 mx-4 animate-bounce" />
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-white">{formData.arrivalAirport}</p>
                                        <p className="text-sm text-gray-400 mt-1">{getAirportName(formData.arrivalAirport)}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Row 1: Airline, Flight Number, Gate */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-cyan-400">
                                        Hãng hàng không *
                                    </label>
                                    <select
                                        className="w-full h-14 px-4 rounded-xl bg-gray-800/50 border-2 border-white/10 text-white text-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all appearance-none cursor-pointer"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2322d3ee'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '20px' }}
                                        value={formData.airline}
                                        onChange={(e) => {
                                            const selectedAirline = airlines.find(a => a.name === e.target.value);
                                            setFormData({ ...formData, airline: e.target.value, aircraftType: "" });
                                            if (selectedAirline) {
                                                fetchFleet(selectedAirline.id);
                                            } else {
                                                setAirlineFleet([]);
                                            }
                                        }}
                                        required
                                    >
                                        <option value="">Chọn hãng bay</option>
                                        {airlines.map((airline) => (
                                            <option key={airline.id} value={airline.name}>{airline.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-cyan-400">
                                        Số hiệu chuyến bay *
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full h-14 px-4 rounded-xl bg-gray-800/50 border-2 border-white/10 text-white text-lg placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                                        placeholder="VD: AF123"
                                        value={formData.flightNumber}
                                        onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value.toUpperCase() })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-cyan-400">
                                        Cổng (Gate) *
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full h-14 px-4 rounded-xl bg-gray-800/50 border-2 border-white/10 text-white text-lg placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                                        placeholder="VD: A12"
                                        value={formData.gate}
                                        onChange={(e) => setFormData({ ...formData, gate: e.target.value.toUpperCase() })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Row 2: Aircraft, Departure, Arrival */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-cyan-400">
                                        Loại máy bay *
                                    </label>
                                    <select
                                        className="w-full h-14 px-4 rounded-xl bg-gray-800/50 border-2 border-white/10 text-white text-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all appearance-none cursor-pointer disabled:opacity-50"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2322d3ee'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '20px' }}
                                        value={formData.aircraftType}
                                        onChange={(e) => setFormData({ ...formData, aircraftType: e.target.value })}
                                        required
                                        disabled={!formData.airline || loadingFleet}
                                    >
                                        <option value="">
                                            {loadingFleet ? "Đang tải..." : !formData.airline ? "Chọn hãng bay trước" : airlineFleet.length === 0 ? "Hãng chưa có máy bay" : "Chọn máy bay"}
                                        </option>
                                        {airlineFleet.map((aircraft) => (
                                            <option key={aircraft.id} value={aircraft.aircraft_name}>{aircraft.aircraft_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-emerald-400">
                                        🛫 Sân bay khởi hành *
                                    </label>
                                    <select
                                        className="w-full h-14 px-4 rounded-xl bg-emerald-900/20 border-2 border-emerald-500/30 text-white text-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2310b981'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '20px' }}
                                        value={formData.departureAirport}
                                        onChange={(e) => setFormData({ ...formData, departureAirport: e.target.value })}
                                        required
                                    >
                                        <option value="">Chọn điểm đi</option>
                                        {AIRPORTS.map((airport) => (
                                            <option key={airport.code} value={airport.code}>
                                                {airport.code} - {airport.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-orange-400">
                                        🛬 Sân bay đến *
                                    </label>
                                    <select
                                        className="w-full h-14 px-4 rounded-xl bg-orange-900/20 border-2 border-orange-500/30 text-white text-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all appearance-none cursor-pointer"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23f97316'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '20px' }}
                                        value={formData.arrivalAirport}
                                        onChange={(e) => setFormData({ ...formData, arrivalAirport: e.target.value })}
                                        required
                                    >
                                        <option value="">Chọn điểm đến</option>
                                        {AIRPORTS.map((airport) => (
                                            <option key={airport.code} value={airport.code}>
                                                {airport.code} - {airport.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Row 3: Crew */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-cyan-400">
                                        Cơ trưởng
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full h-14 px-4 rounded-xl bg-gray-800/50 border-2 border-white/10 text-white text-lg placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                                        placeholder="Tên cơ trưởng"
                                        value={formData.captain}
                                        onChange={(e) => setFormData({ ...formData, captain: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-cyan-400">
                                        Cơ phó (tùy chọn)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full h-14 px-4 rounded-xl bg-gray-800/50 border-2 border-white/10 text-white text-lg placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                                        placeholder="Tên cơ phó"
                                        value={formData.firstOfficer}
                                        onChange={(e) => setFormData({ ...formData, firstOfficer: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="w-full h-16 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xl font-bold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                >
                                    <Plane className="w-6 h-6" />
                                    Khai báo chuyến bay
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Active Flights List - READ ONLY, no action buttons */}
            <GlassCard className="p-6">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    Chuyến bay đang hoạt động ({flights.filter((f) => f.status === "IN_FLIGHT").length})
                </h2>

                <div className="space-y-4">
                    {flights.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Plane className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                            <p>Chưa có chuyến bay nào được khai báo</p>
                        </div>
                    ) : (
                        flights.map((flight) => (
                            <div
                                key={flight.id}
                                className={`p-5 rounded-xl border transition-all ${flight.status === "EMERGENCY"
                                    ? "bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                                    : flight.status === "REQUESTING_GROUND_CREW"
                                        ? "bg-amber-500/10 border-amber-500/30"
                                        : flight.status === "LANDED"
                                            ? "bg-emerald-500/10 border-emerald-500/30 opacity-60"
                                            : "bg-gray-900/50 border-white/10 hover:border-cyan-500/30"
                                    }`}
                            >
                                {/* Flight Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`flex items-center justify-center w-14 h-14 rounded-xl ${flight.status === "EMERGENCY"
                                                ? "bg-red-500/20 text-red-400"
                                                : flight.status === "LANDED"
                                                    ? "bg-emerald-500/20 text-emerald-400"
                                                    : "bg-cyan-500/20 text-cyan-400"
                                                }`}
                                        >
                                            <Plane className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl font-bold text-white">
                                                    {flight.flightNumber}
                                                </span>
                                                <span className="px-2 py-1 text-xs rounded-full bg-cyan-500/20 text-cyan-400">
                                                    {flight.airline}
                                                </span>
                                                <span className="text-sm text-gray-400">
                                                    {flight.aircraftType}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-gray-400">
                                                <MapPin className="w-4 h-4" />
                                                <span>
                                                    {flight.departureAirport} → {flight.arrivalAirport}
                                                </span>
                                                <span className="text-gray-600">|</span>
                                                <span>Gate {flight.gate}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-cyan-400" />
                                            <FlightTimer
                                                startTime={flight.declaredAt}
                                                className="text-xl font-bold text-white font-mono"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Thời gian bay</p>
                                    </div>
                                </div>

                                {/* Crew Info */}
                                <div className="flex items-center gap-6 mt-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-400">Cơ trưởng:</span>
                                        <span className="text-white font-medium">
                                            {flight.captain || "N/A"}
                                        </span>
                                    </div>
                                    {flight.firstOfficer && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400">Cơ phó:</span>
                                            <span className="text-white font-medium">
                                                {flight.firstOfficer}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Status badge - NO ACTION BUTTONS */}
                                {flight.status !== "IN_FLIGHT" && (
                                    <div className="pt-4 mt-4 border-t border-white/10">
                                        <span
                                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${flight.status === "LANDED"
                                                ? "bg-emerald-500/20 text-emerald-400"
                                                : flight.status === "EMERGENCY"
                                                    ? "bg-red-500/20 text-red-400"
                                                    : "bg-amber-500/20 text-amber-400"
                                                }`}
                                        >
                                            {flight.status === "LANDED" && (
                                                <>
                                                    <CheckCircle className="w-4 h-4" />
                                                    Đã hạ cánh
                                                </>
                                            )}
                                            {flight.status === "EMERGENCY" && (
                                                <>
                                                    <AlertTriangle className="w-4 h-4" />
                                                    Tình trạng khẩn cấp
                                                </>
                                            )}
                                            {flight.status === "REQUESTING_GROUND_CREW" && (
                                                <>
                                                    <Truck className="w-4 h-4" />
                                                    Đang chờ Ground Crew
                                                </>
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
