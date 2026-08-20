import { createToken, publicUser } from "../utils/auth";
import { requireJsonBody } from "../utils/http";
import { withGuards } from "../utils/handlers";
import { conflict, created, notFound, ok, unauthorized, unprocessable } from "../utils/response";

function findUserByEmail(schema, email) {
  return schema.users.findBy({ email: String(email).trim().toLowerCase() });
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export function registerAuthRoutes(server) {
  server.post(
    "/auth/register",
    withGuards((schema, request) => {
      const parsed = requireJsonBody(request);
      if (parsed.error) {
        return parsed.error;
      }

      const {
        fullName,
        name,
        bio = "",
        email,
        address = "",
        lat,
        lng,
        latitude,
        longitude,
        password,
        confirmPassword,
        acceptedTerms,
        role = "doctor",
        specialtyId,
        departmentId,
        phone = "",
      } = parsed.body;

      const displayName = (fullName || name || "").trim();
      const errors = {};

      if (!displayName) errors.fullName = "Full name is required";
      if (!email?.trim()) errors.email = "Email is required";
      else if (!isEmail(email)) errors.email = "Enter a valid email address";
      if (!password) errors.password = "Password is required";
      if (password && password.length < 6) errors.password = "Password must be at least 6 characters";
      if (confirmPassword !== undefined && confirmPassword !== password) {
        errors.confirmPassword = "Passwords do not match";
      }
      if (acceptedTerms === false) {
        errors.acceptedTerms = "You must agree to the Terms of Service";
      }
      if (role && !["patient", "doctor"].includes(role)) {
        errors.role = "Role must be patient or doctor";
      }

      if (Object.keys(errors).length) {
        return unprocessable("Validation failed", errors);
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (findUserByEmail(schema, normalizedEmail)) {
        return conflict("Email already exists", { email: "This email is already registered" });
      }

      const selectedDepartmentId = departmentId ?? specialtyId;
      if (role === "doctor" && selectedDepartmentId && !schema.specialties.find(selectedDepartmentId)) {
        return unprocessable("Validation failed", { departmentId: "Department not found" });
      }

      const user = schema.users.create({
        fullName: displayName,
        email: normalizedEmail,
        password,
        role,
      });

      const parsedLat = lat ?? latitude;
      const parsedLng = lng ?? longitude;

      if (role === "doctor") {
        const specialty = selectedDepartmentId
          ? schema.specialties.find(selectedDepartmentId)
          : schema.specialties.first();
        const doctor = schema.doctors.create({
          user,
          specialty,
          fullName: displayName,
          title: "Doctor",
          bio: bio || "Newly registered doctor.",
          clinicName: "Preclinic",
          phone,
          photoUrl: null,
          experienceYears: 1,
          consultationFee: 300,
          rating: 0,
          reviewsCount: 0,
          workingHours: { from: "12:00", to: "21:00" },
          code: `DT${2000 + schema.doctors.all().length}`,
          qualifications: "MBBS",
          licenseNumber: `MLS${88860000 + schema.doctors.all().length}`,
          gender: "unspecified",
          dateOfBirth: null,
          bloodGroup: null,
          address,
          lat: parsedLat === undefined || parsedLat === "" ? null : Number(parsedLat),
          lng: parsedLng === undefined || parsedLng === "" ? null : Number(parsedLng),
          education: [],
          awards: [],
          certifications: [],
        });
        user.update({ doctor });

        for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek += 1) {
          schema.workingSchedules.create({
            doctor,
            dayOfWeek,
            from: "12:00",
            to: "21:00",
            isOff: dayOfWeek === 5,
          });
        }
      } else {
        const patient = schema.patients.create({
          user,
          fullName: displayName,
          email: normalizedEmail,
          phone,
          gender: "unspecified",
          dateOfBirth: null,
          address,
          photoUrl: null,
        });
        user.update({ patient });
      }

      return created({
        token: createToken(user),
        expiresIn: "24h",
        user: publicUser(user),
      });
    }),
  );

  server.post(
    "/auth/login",
    withGuards((schema, request) => {
      const parsed = requireJsonBody(request);
      if (parsed.error) {
        return parsed.error;
      }

      const { email, password, rememberMe = false } = parsed.body;
      const errors = {};
      if (!email?.trim()) errors.email = "Email is required";
      if (!password) errors.password = "Password is required";
      if (Object.keys(errors).length) {
        return unprocessable("Validation failed", errors);
      }

      const user = findUserByEmail(schema, email);
      if (!user || user.password !== password) {
        return unauthorized("Invalid email or password");
      }

      return ok({
        token: createToken(user, { rememberMe: Boolean(rememberMe) }),
        expiresIn: rememberMe ? "30d" : "24h",
        rememberMe: Boolean(rememberMe),
        user: publicUser(user),
      });
    }),
  );

  server.post(
    "/auth/forgot-password",
    withGuards((schema, request) => {
      const parsed = requireJsonBody(request);
      if (parsed.error) {
        return parsed.error;
      }

      if (!parsed.body.email?.trim()) {
        return unprocessable("Validation failed", { email: "Email is required" });
      }

      const user = findUserByEmail(schema, parsed.body.email);
      if (!user) {
        return notFound("No account found with this email");
      }

      return ok({
        sent: true,
        message: "A password reset link was sent to your email. This is a training simulation.",
      });
    }),
  );

  server.get(
    "/auth/me",
    withGuards(
      (_schema, request) => ok(publicUser(request.authUser)),
      { auth: true },
    ),
  );
}
