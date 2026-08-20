import { paginate } from "../utils/pagination";
import { getQuery, requireJsonBody } from "../utils/http";
import { withGuards } from "../utils/handlers";
import { created, notFound, ok, unprocessable } from "../utils/response";
import { serializePatient } from "../serializers";

function filterPatients(patients, request) {
  const q = (getQuery(request, "q") || getQuery(request, "search")).toLowerCase();
  const gender = getQuery(request, "gender");

  return patients.filter((patient) => {
    if (gender && patient.gender !== gender) return false;
    if (q) {
      const haystack = `${patient.fullName} ${patient.phone ?? ""} ${patient.email ?? ""} ${patient.address ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function registerPatientRoutes(server) {
  server.get(
    "/patients",
    withGuards(
      (schema, request) => {
        const items = filterPatients(schema.patients.all().models, request);
        const page = paginate(items, request, { defaultLimit: 12 });
        return ok(page.data.map(serializePatient), {
          meta: {
            ...page.meta,
            totalPatients: schema.patients.all().length,
          },
        });
      },
      { auth: true, role: "doctor" },
    ),
  );

  server.get(
    "/patients/:id",
    withGuards(
      (schema, request) => {
        const patient = schema.patients.find(request.params.id);
        if (!patient) {
          return notFound("Patient not found");
        }
        return ok(serializePatient(patient));
      },
      { auth: true, role: "doctor" },
    ),
  );

  server.post(
    "/patients",
    withGuards(
      (schema, request) => {
        const parsed = requireJsonBody(request);
        if (parsed.error) {
          return parsed.error;
        }

        const { fullName, name, email, phone = "", gender = "unspecified", dateOfBirth, address = "", photoUrl } = parsed.body;
        const displayName = (fullName || name || "").trim();
        const errors = {};
        if (!displayName) errors.fullName = "Full name is required";
        if (Object.keys(errors).length) {
          return unprocessable("Validation failed", errors);
        }

        const patient = schema.patients.create({
          fullName: displayName,
          email: email ? String(email).trim().toLowerCase() : "",
          phone,
          gender,
          dateOfBirth: dateOfBirth || null,
          address,
          photoUrl: photoUrl || null,
        });

        return created(serializePatient(patient));
      },
      { auth: true, role: "doctor" },
    ),
  );

  server.put(
    "/patients/:id",
    withGuards(
      (schema, request) => {
        const patient = schema.patients.find(request.params.id);
        if (!patient) {
          return notFound("Patient not found");
        }

        const parsed = requireJsonBody(request);
        if (parsed.error) {
          return parsed.error;
        }

        const body = parsed.body;
        const updates = {};
        ["fullName", "email", "phone", "gender", "dateOfBirth", "address", "photoUrl"].forEach((key) => {
          if (body[key] !== undefined) updates[key] = body[key];
        });
        if (body.name) updates.fullName = body.name;

        patient.update(updates);
        return ok(serializePatient(patient));
      },
      { auth: true, role: "doctor" },
    ),
  );
}
