"use client";

import { useEffect } from "react";
import { db } from "@/lib/db";

export default function InitDB() {
    useEffect(() => {
        db.init();
    }, []);

    return null;
}
