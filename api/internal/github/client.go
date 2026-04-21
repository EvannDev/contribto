package github

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	gogithub "github.com/google/go-github/v72/github"
	"golang.org/x/oauth2"
)

// Client handles GitHub OAuth exchange and authenticated API calls via the
// google/go-github SDK. ExchangeCode uses raw HTTP because the OAuth token
// endpoint is not part of the REST API covered by the SDK.
type Client struct {
	httpClient   *http.Client
	clientID     string
	clientSecret string
}

// GitHubUser holds the fields returned after OAuth login.
type GitHubUser struct {
	ID    int64
	Login string
}

// GitHubRepo holds the fields we care about from the starred repos endpoint.
type GitHubRepo struct {
	ID              int64
	FullName        string
	Description     string
	Language        string
	StargazersCount int
}

// GitHubIssue holds the fields we care about from the issues endpoint.
type GitHubIssue struct {
	ID        int64
	Number    int
	Title     string
	HTMLURL   string
	Labels    []string
	CreatedAt time.Time
	UpdatedAt time.Time
}

func NewClient(clientID, clientSecret string) *Client {
	return &Client{
		httpClient:   &http.Client{Timeout: 10 * time.Second},
		clientID:     clientID,
		clientSecret: clientSecret,
	}
}

// apiClient returns a go-github client authenticated with the given token.
func apiClient(ctx context.Context, token string) *gogithub.Client {
	ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: token})
	return gogithub.NewClient(oauth2.NewClient(ctx, ts))
}

// ExchangeCode trades an OAuth authorization code for an access token.
// Uses raw HTTP: the GitHub OAuth token endpoint is not part of the REST API.
func (c *Client) ExchangeCode(ctx context.Context, code string) (string, error) {
	body := url.Values{
		"client_id":     {c.clientID},
		"client_secret": {c.clientSecret},
		"code":          {code},
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		"https://github.com/login/oauth/access_token",
		strings.NewReader(body.Encode()),
	)
	if err != nil {
		return "", fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("post access_token: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("unexpected status %d from GitHub token endpoint", resp.StatusCode)
	}

	var result struct {
		AccessToken string `json:"access_token"`
		Error       string `json:"error"`
		ErrorDesc   string `json:"error_description"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("decode token response: %w", err)
	}
	if result.Error != "" {
		return "", fmt.Errorf("github oauth error: %s — %s", result.Error, result.ErrorDesc)
	}
	if result.AccessToken == "" {
		return "", fmt.Errorf("empty access token in response")
	}
	return result.AccessToken, nil
}

// GetUser fetches the authenticated user's GitHub profile.
func (c *Client) GetUser(ctx context.Context, token string) (*GitHubUser, error) {
	gh := apiClient(ctx, token)
	u, _, err := gh.Users.Get(ctx, "")
	if err != nil {
		return nil, fmt.Errorf("get user: %w", err)
	}
	return &GitHubUser{ID: u.GetID(), Login: u.GetLogin()}, nil
}

// GetStarredRepos fetches all repos starred by the authenticated user.
func (c *Client) GetStarredRepos(ctx context.Context, token string) ([]GitHubRepo, error) {
	gh := apiClient(ctx, token)
	opts := &gogithub.ActivityListStarredOptions{
		ListOptions: gogithub.ListOptions{PerPage: 100},
	}

	var all []GitHubRepo
	for {
		starred, resp, err := gh.Activity.ListStarred(ctx, "", opts)
		if err != nil {
			return nil, fmt.Errorf("list starred repos: %w", err)
		}
		for _, s := range starred {
			r := s.GetRepository()
			all = append(all, GitHubRepo{
				ID:              r.GetID(),
				FullName:        r.GetFullName(),
				Description:     r.GetDescription(),
				Language:        r.GetLanguage(),
				StargazersCount: r.GetStargazersCount(),
			})
		}
		if resp.NextPage == 0 {
			break
		}
		opts.ListOptions.Page = resp.NextPage
	}
	return all, nil
}

// GetRepoIssues fetches open issues labeled "good first issue" for the given repo.
func (c *Client) GetRepoIssues(ctx context.Context, token, fullName string) ([]GitHubIssue, error) {
	parts := strings.SplitN(fullName, "/", 2)
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid repo full name: %s", fullName)
	}
	owner, repo := parts[0], parts[1]

	gh := apiClient(ctx, token)
	opts := &gogithub.IssueListByRepoOptions{
		State:  "open",
		Labels: []string{"good first issue"},
		ListOptions: gogithub.ListOptions{PerPage: 100},
	}

	var all []GitHubIssue
	for {
		issues, resp, err := gh.Issues.ListByRepo(ctx, owner, repo, opts)
		if err != nil {
			if resp != nil && resp.StatusCode == http.StatusNotFound {
				return nil, nil
			}
			return nil, fmt.Errorf("list issues: %w", err)
		}
		for _, i := range issues {
			labels := make([]string, len(i.Labels))
			for j, l := range i.Labels {
				labels[j] = l.GetName()
			}
			all = append(all, GitHubIssue{
				ID:        i.GetID(),
				Number:    i.GetNumber(),
				Title:     i.GetTitle(),
				HTMLURL:   i.GetHTMLURL(),
				Labels:    labels,
				CreatedAt: i.GetCreatedAt().Time,
				UpdatedAt: i.GetUpdatedAt().Time,
			})
		}
		if resp.NextPage == 0 {
			break
		}
		opts.ListOptions.Page = resp.NextPage
	}
	return all, nil
}
