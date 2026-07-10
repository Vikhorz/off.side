"use server";

import { revalidatePath } from "next/cache";

import { savePredictionForUser } from "@/lib/demo-store";
import { getCurrentUser } from "@/lib/session";
import type { SavePredictionInput } from "@/lib/types";

export type SavePredictionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function savePredictionAction(
  input: SavePredictionInput,
): Promise<SavePredictionState> {
  try {
    const currentUser = await getCurrentUser();
    const prediction = await savePredictionForUser(currentUser, input);
    revalidatePath("/");

    return {
      status: "success",
      message: `Saved ${prediction.homeScore}-${prediction.awayScore}${
        prediction.boosted ? " with boost" : ""
      }. Points are awarded only after the scoring job runs.`,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Could not save this prediction.",
    };
  }
}
