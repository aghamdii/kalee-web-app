import { Type } from "@google/genai";

// Itinerary Response Schema - matches the original Flutter DTO structure
export const ItineraryResponseSchemaV1 = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        destination: { type: Type.STRING },
        summary: { type: Type.STRING },
        weather: {
            type: Type.OBJECT,
            properties: {
                condition: { type: Type.STRING },
                emoji: { type: Type.STRING },
                temperature_range: { type: Type.STRING, description: "The temperature range for the destination in Celsius (e.g. '20-25°C')" },
                practical_tip: { type: Type.STRING }
            },
            required: ["condition", "emoji", "temperature_range", "practical_tip"],
            propertyOrdering: ["condition", "emoji", "temperature_range", "practical_tip"]
        },
        days: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    theme: { type: Type.STRING },
                    activities: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                name: { type: Type.STRING, description: "Try to give the exact name of the venue or activity instead of using generic names." },
                                description: { type: Type.STRING },
                                category: {
                                    type: Type.STRING,
                                    enum: [
                                        "historic", "food", "culture", "entertainment", "nature",
                                        "shopping", "adventure", "sports", "wellness", "photography",
                                        "localExperience", "education", "scenic", "markets", "accommodation"
                                    ]
                                },
                                emoji: { type: Type.STRING },
                                image_url: { type: Type.STRING },
                                timing: {
                                    type: Type.OBJECT,
                                    properties: {
                                        start_time: { type: Type.STRING, description: "return the value in 24 hour format (HH:MM)" },
                                        end_time: { type: Type.STRING, description: "return the value in 24 hour format (HH:MM)" }
                                    },
                                    required: ["start_time", "end_time"],
                                    propertyOrdering: ["start_time", "end_time"]
                                },
                                price: {
                                    type: Type.OBJECT,
                                    properties: {
                                        amount: { type: Type.NUMBER },
                                        currency: { type: Type.STRING },
                                        is_free: { type: Type.BOOLEAN }
                                    },
                                    required: ["amount", "currency", "is_free"],
                                    propertyOrdering: ["amount", "currency", "is_free"]
                                },
                                location: {
                                    type: Type.OBJECT,
                                    properties: {
                                        address: { type: Type.STRING },
                                        map_url: { type: Type.STRING }
                                    },
                                    propertyOrdering: ["address", "map_url"]
                                },
                                booking: {
                                    type: Type.OBJECT,
                                    properties: {
                                        requires_booking: { type: Type.BOOLEAN },
                                        booking_url: { type: Type.STRING },
                                        details_url: { type: Type.STRING }
                                    },
                                    required: ["requires_booking"],
                                    propertyOrdering: ["requires_booking", "booking_url", "details_url"]
                                }
                            },
                            required: [
                                "id", "name", "description", "category", "emoji", "timing", "price"
                            ],
                            propertyOrdering: [
                                "id", "name", "description", "category", "emoji", "image_url",
                                "timing", "price", "location", "booking"
                            ]
                        }
                    }
                },
                required: ["activities"],
                propertyOrdering: ["theme", "activities"]
            }
        },
        cost_breakdown: {
            type: Type.OBJECT,
            properties: {
                total_cost: { type: Type.NUMBER },
                currency: { type: Type.STRING },
                daily_costs: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            day: { type: Type.INTEGER },
                            amount: { type: Type.NUMBER },
                            breakdown: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        category: { type: Type.STRING },
                                        amount: { type: Type.NUMBER }
                                    },
                                    required: ["category", "amount"],
                                    propertyOrdering: ["category", "amount"]
                                }
                            }
                        },
                        required: ["day", "amount", "breakdown"],
                        propertyOrdering: ["day", "amount", "breakdown"]
                    }
                }
            },
            required: ["total_cost", "currency", "daily_costs"],
            propertyOrdering: ["total_cost", "currency", "daily_costs"]
        },
        country_emoji: { type: Type.STRING },
        background_color: { type: Type.STRING }
    },
    required: [
        "title", "destination", "summary", "weather", "days"
    ],
    propertyOrdering: [
        "title", "destination", "summary", "weather", "days",
        "cost_breakdown", "country_emoji", "background_color"
    ]
};

export const ItineraryResponseSchemaV2 = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        destination: { type: Type.STRING },
        weather: {
            type: Type.OBJECT,
            properties: {
                condition: { type: Type.STRING },
                emoji: { type: Type.STRING },
                temperature_range: { type: Type.STRING, description: "The temperature range for the destination in Celsius (e.g. '20-25°C')" }
            },
            required: ["condition", "emoji", "temperature_range"],
            propertyOrdering: ["condition", "emoji", "temperature_range"]
        },
        days: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    activities: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                name: { type: Type.STRING, description: "Try to give the exact name of the venue or activity instead of using generic names." },
                                venue_name: { type: Type.STRING, description: "The name of the venue or activity without adding any other text" },
                                description: { type: Type.STRING },
                                category: {
                                    type: Type.STRING,
                                    enum: [
                                        "historic", "food", "culture", "entertainment", "nature",
                                        "shopping", "adventure", "sports", "wellness", "photography",
                                        "localExperience", "education", "scenic", "markets", "accommodation"
                                    ]
                                },
                                emoji: { type: Type.STRING },
                                timing: {
                                    type: Type.OBJECT,
                                    properties: {
                                        start_time: { type: Type.STRING, description: "return the value in 24 hour format (HH:MM)" },
                                        end_time: { type: Type.STRING, description: "return the value in 24 hour format (HH:MM)" }
                                    },
                                    required: ["start_time", "end_time"],
                                    propertyOrdering: ["start_time", "end_time"]
                                },
                                price: {
                                    type: Type.OBJECT,
                                    properties: {
                                        amount: { type: Type.NUMBER },
                                        currency: { type: Type.STRING },
                                        is_free: { type: Type.BOOLEAN }
                                    },
                                    required: ["amount", "currency", "is_free"],
                                    propertyOrdering: ["amount", "currency", "is_free"]
                                },
                                booking: {
                                    type: Type.OBJECT,
                                    properties: {
                                        requires_booking: { type: Type.BOOLEAN }
                                    },
                                    required: ["requires_booking"],
                                    propertyOrdering: ["requires_booking"]
                                }
                            },
                            required: [
                                "id", "name", "description", "category", "emoji", "timing", "price", "booking"
                            ],
                            propertyOrdering: [
                                "id", "name", "description", "category", "emoji", "timing", "price", "booking"
                            ]
                        }
                    }
                },
                required: ["activities"],
                propertyOrdering: ["activities"]
            }
        },
        country_emoji: { type: Type.STRING },
        background_color: { type: Type.STRING }
    },
    required: [
        "title", "destination", "weather", "days", "country_emoji", "background_color"
    ],
    propertyOrdering: [
        "title", "destination", "weather", "days", "country_emoji", "background_color"
    ]
};

// Activity Shuffle Response Schema - matches Flutter structure
export const ActivityShuffleResponseSchemaV1 = {
    type: Type.OBJECT,
    properties: {
        activities: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: {
                        type: Type.STRING,
                        enum: [
                            "historic", "food", "culture", "entertainment", "nature",
                            "shopping", "adventure", "sports", "wellness", "photography",
                            "localExperience", "education", "scenic", "markets", "accommodation"
                        ]
                    },
                    emoji: { type: Type.STRING },
                    image_url: { type: Type.STRING },
                    timing: {
                        type: Type.OBJECT,
                        properties: {
                            start_time: { type: Type.STRING, description: "return the value in 24 hour format (HH:MM)" },
                            end_time: { type: Type.STRING, description: "return the value in 24 hour format (HH:MM)" }
                        },
                        required: ["start_time", "end_time"],
                        propertyOrdering: ["start_time", "end_time"]
                    },
                    price: {
                        type: Type.OBJECT,
                        properties: {
                            amount: { type: Type.NUMBER },
                            currency: { type: Type.STRING },
                            is_free: { type: Type.BOOLEAN }
                        },
                        required: ["amount", "currency", "is_free"],
                        propertyOrdering: ["amount", "currency", "is_free"]
                    },
                    location: {
                        type: Type.OBJECT,
                        properties: {
                            address: { type: Type.STRING },
                            map_url: { type: Type.STRING }
                        },
                        propertyOrdering: ["address", "map_url"]
                    },
                    booking: {
                        type: Type.OBJECT,
                        properties: {
                            requires_booking: { type: Type.BOOLEAN },
                            booking_url: { type: Type.STRING },
                            details_url: { type: Type.STRING }
                        },
                        required: ["requires_booking"],
                        propertyOrdering: ["requires_booking", "booking_url", "details_url"]
                    }
                },
                required: [
                    "id", "name", "description", "category", "emoji", "timing", "price"
                ],
                propertyOrdering: [
                    "id", "name", "description", "category", "emoji", "image_url",
                    "timing", "price", "location", "booking"
                ]
            }
        }
    },
    required: ["activities"],
    propertyOrdering: ["activities"]
};

// Activity Shuffle Response Schema V2 - copy of V1 for now
export const ActivityShuffleResponseSchemaV2 = {
    type: Type.OBJECT,
    properties: {
        activities: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    venue_name: { type: Type.STRING, description: "The name of the venue or activity without adding any other text" },
                    description: { type: Type.STRING },
                    category: {
                        type: Type.STRING,
                        enum: [
                            "historic", "food", "culture", "entertainment", "nature",
                            "shopping", "adventure", "sports", "wellness", "photography",
                            "localExperience", "education", "scenic", "markets", "accommodation"
                        ]
                    },
                    emoji: { type: Type.STRING },
                    timing: {
                        type: Type.OBJECT,
                        properties: {
                            start_time: { type: Type.STRING, description: "return the value in 24 hour format (HH:MM)" },
                            end_time: { type: Type.STRING, description: "return the value in 24 hour format (HH:MM)" }
                        },
                        required: ["start_time", "end_time"],
                        propertyOrdering: ["start_time", "end_time"]
                    },
                    price: {
                        type: Type.OBJECT,
                        properties: {
                            amount: { type: Type.NUMBER },
                            currency: { type: Type.STRING },
                            is_free: { type: Type.BOOLEAN }
                        },
                        required: ["amount", "currency", "is_free"],
                        propertyOrdering: ["amount", "currency", "is_free"]
                    },
                    booking: {
                        type: Type.OBJECT,
                        properties: {
                            requires_booking: { type: Type.BOOLEAN }
                        },
                        required: ["requires_booking"],
                        propertyOrdering: ["requires_booking"]
                    }
                },
                required: [
                    "id", "name", "description", "category", "emoji", "timing", "price", "booking"
                ],
                propertyOrdering: [
                    "id", "name", "description", "category", "emoji", "timing", "price", "booking"
                ]
            }
        }
    },
    required: ["activities"],
    propertyOrdering: ["activities"]
};

// Single Activity Edit Response Schema - matches Flutter structure
export const ActivityEditResponseSchemaV1 = {
    type: Type.OBJECT,
    properties: {
        activity: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                category: {
                    type: Type.STRING,
                    enum: [
                        "historic", "food", "culture", "entertainment", "nature",
                        "shopping", "adventure", "sports", "wellness", "photography",
                        "localExperience", "education", "scenic", "markets", "accommodation"
                    ]
                },
                emoji: { type: Type.STRING },
                image_url: { type: Type.STRING },
                timing: {
                    type: Type.OBJECT,
                    properties: {
                        start_time: { type: Type.STRING, description: "return the value in 24 hour format (HH:MM)" },
                        end_time: { type: Type.STRING, description: "return the value in 24 hour format (HH:MM)" }
                    },
                    required: ["start_time", "end_time"],
                    propertyOrdering: ["start_time", "end_time"]
                },
                price: {
                    type: Type.OBJECT,
                    properties: {
                        amount: { type: Type.NUMBER },
                        currency: { type: Type.STRING },
                        is_free: { type: Type.BOOLEAN }
                    },
                    required: ["amount", "currency", "is_free"],
                    propertyOrdering: ["amount", "currency", "is_free"]
                },
                location: {
                    type: Type.OBJECT,
                    properties: {
                        address: { type: Type.STRING },
                        map_url: { type: Type.STRING }
                    },
                    propertyOrdering: ["address", "map_url"]
                },
                booking: {
                    type: Type.OBJECT,
                    properties: {
                        requires_booking: { type: Type.BOOLEAN },
                        booking_url: { type: Type.STRING },
                        details_url: { type: Type.STRING }
                    },
                    required: ["requires_booking"],
                    propertyOrdering: ["requires_booking", "booking_url", "details_url"]
                }
            },
            required: [
                "id", "name", "description", "category", "emoji", "timing", "price"
            ],
            propertyOrdering: [
                "id", "name", "description", "category", "emoji", "image_url",
                "timing", "price", "location", "booking"
            ]
        }
    },
    required: ["activity"],
    propertyOrdering: ["activity"]
};

// Single Activity Edit Response Schema V2 - copy of V1 for now
export const ActivityEditResponseSchemaV2 = {
    type: Type.OBJECT,
    properties: {
        activity: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                venue_name: { type: Type.STRING, description: "The name of the venue or activity without adding any other text" },
                category: {
                    type: Type.STRING,
                    enum: [
                        "historic", "food", "culture", "entertainment", "nature",
                        "shopping", "adventure", "sports", "wellness", "photography",
                        "localExperience", "education", "scenic", "markets", "accommodation"
                    ]
                },
                emoji: { type: Type.STRING },
                timing: {
                    type: Type.OBJECT,
                    properties: {
                        start_time: { type: Type.STRING, description: "return the value in 24 hour format (HH:MM)" },
                        end_time: { type: Type.STRING, description: "return the value in 24 hour format (HH:MM)" }
                    },
                    required: ["start_time", "end_time"],
                    propertyOrdering: ["start_time", "end_time"]
                },
                price: {
                    type: Type.OBJECT,
                    properties: {
                        amount: { type: Type.NUMBER },
                        currency: { type: Type.STRING },
                        is_free: { type: Type.BOOLEAN }
                    },
                    required: ["amount", "currency", "is_free"],
                    propertyOrdering: ["amount", "currency", "is_free"]
                },
                booking: {
                    type: Type.OBJECT,
                    properties: {
                        requires_booking: { type: Type.BOOLEAN }
                    },
                    required: ["requires_booking"],
                    propertyOrdering: ["requires_booking"]
                }
            },
            required: [
                "id", "name", "description", "category", "emoji", "timing", "price", "booking"
            ],
            propertyOrdering: [
                "id", "name", "description", "category", "emoji", "timing", "price", "booking"
            ]
        }
    },
    required: ["activity"],
    propertyOrdering: ["activity"]
};
// Schema Selection Utilities for Version Management
export function getItineraryResponseSchema(version?: number | null) {
    switch (version) {
        case 2:
            return ItineraryResponseSchemaV2;
        case 1:
        default:
            return ItineraryResponseSchemaV1; // Default to V1 for backward compatibility
    }
}

export function getActivityShuffleResponseSchema(version?: number | null) {
    switch (version) {
        case 2:
            return ActivityShuffleResponseSchemaV2;
        case 1:
        default:
            return ActivityShuffleResponseSchemaV1; // Default to V1 for backward compatibility
    }
}

export function getActivityEditResponseSchema(version?: number | null) {
    switch (version) {
        case 2:
            return ActivityEditResponseSchemaV2;
        case 1:
        default:
            return ActivityEditResponseSchemaV1; // Default to V1 for backward compatibility
    }
}

// Backward compatibility aliases - Fix existing imports
export const ItineraryResponseSchema = ItineraryResponseSchemaV1;
export const ActivityShuffleResponseSchema = ActivityShuffleResponseSchemaV1;
export const ActivityEditResponseSchema = ActivityEditResponseSchemaV1;