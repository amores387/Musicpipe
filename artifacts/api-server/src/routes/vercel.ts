import { Router, type IRouter } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { GetVercelStatusResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function formatTimestamp(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return new Date(value).toISOString();
}

router.get("/vercel/status", async (req, res) => {
  try {
    const connectors = new ReplitConnectors();
    const response = await connectors.proxy("vercel", "/v10/projects?limit=20", {
      method: "GET",
    });

    const payload = (await response.json()) as {
      projects?: Array<{
        id?: string;
        name?: string;
        framework?: string | null;
        updatedAt?: number | null;
      }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      req.log.warn(
        { status: response.status, providerMessage: payload.error?.message },
        "Vercel status request was not successful",
      );
      return res.json(
        GetVercelStatusResponse.parse({
          connected: false,
          projectCount: 0,
          projects: [],
          checkedAt: new Date().toISOString(),
          message: payload.error?.message || "Vercel is unavailable right now.",
        }),
      );
    }

    const projects = (payload.projects ?? [])
      .filter(
        (project): project is {
          id: string;
          name: string;
          framework?: string | null;
          updatedAt?: number | null;
        } => Boolean(project.id && project.name),
      )
      .map((project) => ({
        id: project.id,
        name: project.name,
        framework: project.framework ?? null,
        updatedAt: formatTimestamp(project.updatedAt),
      }));

    return res.json(
      GetVercelStatusResponse.parse({
        connected: true,
        projectCount: projects.length,
        projects,
        checkedAt: new Date().toISOString(),
        message: projects.length
          ? "Vercel is connected and ready."
          : "Vercel is connected, but no projects were found.",
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Unable to reach Vercel");
    return res.json(
      GetVercelStatusResponse.parse({
        connected: false,
        projectCount: 0,
        projects: [],
        checkedAt: new Date().toISOString(),
        message: "Vercel could not be reached. Try again shortly.",
      }),
    );
  }
});

export default router;