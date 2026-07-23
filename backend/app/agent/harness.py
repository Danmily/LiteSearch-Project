import re
from dataclasses import dataclass, field

from app.models.local_llm import get_generation_model
from app.observability.tracing import traced_stage


def parse_tags(text: str, tags: list[str]) -> dict[str, str]:
    """Extract 【tag】content sections regardless of the order the model emits them in."""
    marker_re = re.compile("【(" + "|".join(re.escape(t) for t in tags) + ")】")
    matches = list(marker_re.finditer(text))
    result: dict[str, str] = {}
    for i, m in enumerate(matches):
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        result[m.group(1)] = text[start:end].strip()
    return result


@dataclass
class AgentTurn:
    agent: str
    prompt: str
    raw_output: str
    parsed: dict[str, str] = field(default_factory=dict)
    ok: bool = False


def run_agent(agent_name: str, prompt: str, tags: list[str], max_tokens: int = 400) -> AgentTurn:
    with traced_stage(f"agent:{agent_name}"):
        raw = get_generation_model().generate(prompt, max_tokens=max_tokens)
    parsed = parse_tags(raw, tags)
    ok = all(t in parsed for t in tags)
    return AgentTurn(agent=agent_name, prompt=prompt, raw_output=raw, parsed=parsed, ok=ok)
