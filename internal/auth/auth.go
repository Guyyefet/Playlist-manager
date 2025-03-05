package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/option"
	"google.golang.org/api/youtube/v3"
)

type AuthService struct {
	Config *oauth2.Config
}

func NewAuthService() (*AuthService, error) {
	// Get absolute path to credentials file
	absPath, err := filepath.Abs("config/credentials.json")
	if err != nil {
		return nil, fmt.Errorf("failed to get absolute path: %v", err)
	}

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
		RedirectURL:  oauthConfig.Web.RedirectURIs[0],
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

func (s *AuthService) getTokenFromWeb() *oauth2.Token {
	authURL := s.Config.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
	fmt.Printf("Go to the following link in your browser: \n%v\n", authURL)

	codeCh := make(chan string)
	server := &http.Server{Addr: ":8080"}

	http.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		code := r.URL.Query().Get("code")
		codeCh <- code
		fmt.Fprintf(w, "Authorization successful! You can close this window.")
		go func() {
			time.Sleep(time.Second)
			server.Shutdown(context.Background())
		}()
	})

	go server.ListenAndServe()
	code := <-codeCh

	token, err := s.Config.Exchange(context.Background(), code)
	if err != nil {
		log.Fatalf("Unable to retrieve token from web: %v", err)
	}
	return token
}
