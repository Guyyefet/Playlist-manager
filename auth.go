package main

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
	config *oauth2.Config
}

func NewAuthService(credentialsPath string) (*AuthService, error) {
	b, err := os.ReadFile(credentialsPath)
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

	return &AuthService{config: config}, nil
}

func (s *AuthService) CreateYouTubeService(ctx context.Context) (*youtube.Service, error) {
	client := s.getClient()
	return youtube.NewService(ctx, option.WithHTTPClient(client))
}

func (s *AuthService) getClient() *http.Client {
	tokenFile := "token.json"
	token, err := s.tokenFromFile(tokenFile)

	if err != nil {
		token = s.getTokenFromWeb()
		s.saveToken(tokenFile, token)
	}

	return s.config.Client(context.Background(), token)
}

func (s *AuthService) tokenFromFile(file string) (*oauth2.Token, error) {
	f, err := os.Open(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	token := &oauth2.Token{}
	err = json.NewDecoder(f).Decode(token)
	return token, err
}

func (s *AuthService) saveToken(path string, token *oauth2.Token) {
	f, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		log.Fatalf("Unable to cache oauth token: %v", err)
	}
	defer f.Close()
	json.NewEncoder(f).Encode(token)
}

func (s *AuthService) getTokenFromWeb() *oauth2.Token {
	authURL := s.config.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
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

	token, err := s.config.Exchange(context.Background(), code)
	if err != nil {
		log.Fatalf("Unable to retrieve token from web: %v", err)
	}
	return token
}
