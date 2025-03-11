package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/option"
	"google.golang.org/api/youtube/v3"
)

type AuthService struct {
	Config        *oauth2.Config
	revokedTokens map[string]time.Time
}

func NewAuthService() (*AuthService, error) {
	// Get absolute path to credentials file
	absPath := "/home/guy/Desktop/projects/playlist manager/config/credentials.json"

	b, err := os.ReadFile(absPath)
	if err != nil {
		return nil, fmt.Errorf("unable to read client secret file: %v", err)
	}

	var oauthConfig struct {
		Web struct {
			ClientID     string   `json:"client_id"`
			ClientSecret string   `json:"client_secret"`
			RedirectURIs []string `json:"redirect_uris"`
		} `json:"web"`
	}

	if err := json.Unmarshal(b, &oauthConfig); err != nil {
		return nil, fmt.Errorf("unable to parse client secret file: %v", err)
	}

	config := &oauth2.Config{
		ClientID:     oauthConfig.Web.ClientID,
		ClientSecret: oauthConfig.Web.ClientSecret,
		RedirectURL:  "http://localhost:5173/login/callback",
		Scopes: []string{
			youtube.YoutubeReadonlyScope,
		},
		Endpoint: google.Endpoint,
	}

	return &AuthService{Config: config}, nil
}

func (s *AuthService) CreateYouTubeService(ctx context.Context) (*youtube.Service, error) {
	client := s.getClient()
	return youtube.NewService(ctx, option.WithHTTPClient(client))
}

func (s *AuthService) getClient() *http.Client {
	tokenFile := "config/token.json"
	token, err := s.TokenFromFile(tokenFile)

	if err != nil {
		token = s.getTokenFromWeb()
		s.SaveToken(tokenFile, token)
	}

	return s.Config.Client(context.Background(), token)
}

// TokenFromFile retrieves a token from a local file
func (s *AuthService) TokenFromFile(file string) (*oauth2.Token, error) {
	f, err := os.Open(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	token := &oauth2.Token{}
	err = json.NewDecoder(f).Decode(token)
	return token, err
}

// IsTokenValid checks if the token is valid and not expired
func (s *AuthService) IsTokenValid(token *oauth2.Token) bool {
	if token == nil {
		return false
	}
	return !token.Expiry.IsZero() && token.Expiry.After(time.Now())
}

func (s *AuthService) SaveToken(path string, token *oauth2.Token) {
	f, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		log.Fatalf("Unable to cache oauth token: %v", err)
	}
	defer f.Close()
	json.NewEncoder(f).Encode(token)
}

func (s *AuthService) GetAuthURL() string {
	return s.Config.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
}

// New endpoint to handle frontend callback
func (s *AuthService) HandleAuthCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	token, err := s.Config.Exchange(context.Background(), code)
	if err != nil {
		http.Error(w, "Failed to exchange token", http.StatusBadRequest)
		return
	}

	s.SaveToken("config/token.json", token)
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
	w.WriteHeader(http.StatusOK)
}

func (s *AuthService) GetCachedToken() *oauth2.Token {
	token, err := s.TokenFromFile("config/token.json")
	if err != nil {
		return nil
	}
	return token
}

// AuthStatusResponse represents the authentication status
type AuthStatusResponse struct {
	Authenticated bool `json:"authenticated"`
	NeedsRefresh  bool `json:"needsRefresh"`
}

// HandleAuthStatus checks the current authentication status
func (s *AuthService) HandleAuthStatus(w http.ResponseWriter, r *http.Request) {
	log.Printf("Checking authentication status")

	token := s.GetCachedToken()
	authenticated := s.IsTokenValid(token)
	needsRefresh := token != nil && token.Expiry.Before(time.Now().Add(5*time.Minute))

	log.Printf("Authentication status - Authenticated: %v, Needs Refresh: %v", authenticated, needsRefresh)

	response := AuthStatusResponse{
		Authenticated: authenticated,
		NeedsRefresh:  needsRefresh,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding auth status response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	log.Printf("Successfully returned authentication status")
}

func (s *AuthService) getTokenFromWeb() *oauth2.Token {
	authURL := s.GetAuthURL()
	fmt.Printf("Go to the following link in your browser: \n%v\n", authURL)

	// Use the new unified callback handler
	server := &http.Server{Addr: ":8080"}
	http.HandleFunc("/api/auth/callback", s.HandleAuthCallback)

	go server.ListenAndServe()

	// Wait for token validation
	for !s.IsTokenValid(s.GetCachedToken()) {
		time.Sleep(1 * time.Second)
	}
	return s.GetCachedToken()
}

func (s *AuthService) RevokeToken(token *oauth2.Token) {
	// Add token to revoked tokens map with current time
	s.revokedTokens[token.AccessToken] = time.Now()

	// Delete the token file
	err := os.Remove("config/token.json")
	if err != nil && !os.IsNotExist(err) {
		log.Printf("Error removing token file: %v", err)
	}
}
