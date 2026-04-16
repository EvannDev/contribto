package http

import (
	"net/http"
	"strconv"

	"github.com/gofiber/fiber/v3"
)

// RequireAuth validates the session cookie and injects the userID into locals.
// The encryptcookie middleware (registered globally in main) decrypts the cookie
// value before this handler runs — we only need to parse the plain int64.
func RequireAuth() fiber.Handler {
	return func(c fiber.Ctx) error {
		cookieVal := c.Cookies(sessionCookieName)
		if cookieVal == "" {
			return fiber.NewError(http.StatusUnauthorized, "unauthorized")
		}

		userID, err := strconv.ParseInt(cookieVal, 10, 64)
		if err != nil || userID <= 0 {
			return fiber.NewError(http.StatusUnauthorized, "unauthorized")
		}

		c.Locals("userID", userID)
		return c.Next()
	}
}

// UserIDFromContext returns the authenticated user's ID injected by RequireAuth.
func UserIDFromContext(c fiber.Ctx) int64 {
	v, _ := c.Locals("userID").(int64)
	return v
}
