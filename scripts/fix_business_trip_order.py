import re

file_path = r'd:\Work\TBS II\web\src\app\business-trip\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract proposalForm block
proposal_form_regex = r"(\s*// Form State: Proposal Info\s*const \[proposalForm, setProposalForm\] = useState\(\{[\s\S]*?\}\);)"
proposal_form_match = re.search(proposal_form_regex, content)
if not proposal_form_match:
    print("Could not find proposalForm declaration.")
    exit(1)
proposal_form_str = proposal_form_match.group(1)

# Extract participants block
participants_regex = r"(\s*// Form State: Participants\s*const \[participants, setParticipants\] = useState<TripParticipant\[\]>\(\[\]\);)"
participants_match = re.search(participants_regex, content)
if not participants_match:
    print("Could not find participants declaration.")
    exit(1)
participants_str = participants_match.group(1)

# Remove from content
content = content.replace(proposal_form_str, '')
content = content.replace(participants_str, '')

# Insert before useEffect
target = "const [currentUser, setCurrentUser] = useState<{"
if target not in content:
    print("Could not find currentUser declaration.")
    exit(1)

insertion = proposal_form_str + participants_str + "\n\n  " + target
content = content.replace(target, insertion, 1)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed state declaration order!")
