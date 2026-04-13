package provider

import (
	"errors"
	"fmt"
)

type Adapter interface {
	Name() string
	Mode() string
}

type ManagedAdapter struct {
	Provider string
}

func (m ManagedAdapter) Name() string {
	return m.Provider
}

func (m ManagedAdapter) Mode() string {
	return "managed"
}

type SelfHostedAdapter struct {
	Provider string
}

func (s SelfHostedAdapter) Name() string {
	return s.Provider
}

func (s SelfHostedAdapter) Mode() string {
	return "self_hosted"
}

func NewAdapter(runtime string) (Adapter, error) {
	switch runtime {
	case "managed", "":
		return ManagedAdapter{Provider: "managed-realtime"}, nil
	case "self_hosted":
		return SelfHostedAdapter{Provider: "mini-stack-local"}, nil
	default:
		return nil, errors.New("unsupported provider runtime")
	}
}

func Summary(adapter Adapter) string {
	return fmt.Sprintf("%s (%s)", adapter.Name(), adapter.Mode())
}
