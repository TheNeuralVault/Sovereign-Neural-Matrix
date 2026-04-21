import os

target_file = '/data/data/com.termux/files/home/TheNeuralVault/openclaw_global_swarm.py'
directive_file = '/data/data/com.termux/files/home/TheNeuralVault/QEA-RAM-CURE/hunting_directives.txt'

with open(target_file, 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if line.strip().startswith('AGENTS = ['):
        skip = True
        new_lines.append("def get_dynamic_agents():\n")
        new_lines.append(f"    directive_path = '{directive_file}'\n")
        new_lines.append("    agents = []\n")
        new_lines.append("    if os.path.exists(directive_path):\n")
        new_lines.append("        with open(directive_path, 'r') as df:\n")
        new_lines.append("            for i, d in enumerate(df.readlines()):\n")
        new_lines.append("                d = d.strip()\n")
        new_lines.append("                if d:\n")
        new_lines.append("                    agents.append((openalex_agent, f'Agent-Auto-{i}', d, 'Quantum_Discovery'))\n")
        new_lines.append("    if not agents:\n")
        new_lines.append("        agents.append((omni_web_agent, 'Agent-Fallback', 'latest breakthrough room temperature quantum coherence', 'Physics'))\n")
        new_lines.append("    return agents\n\n")
        continue
    
    if skip and line.strip() == ']':
        skip = False
        continue
        
    if not skip:
        # We also need to update the swarm loop to call the new function
        if "tasks = [func(session, bucket, proxies, aid, query, domain) for func, aid, query, domain in AGENTS]" in line:
            new_lines.append("        dynamic_agents = get_dynamic_agents()\n")
            new_lines.append("        tasks = [func(session, bucket, proxies, aid, query, domain) for func, aid, query, domain in dynamic_agents]\n")
        else:
            new_lines.append(line)

with open(target_file, 'w') as f:
    f.writelines(new_lines)

print("[SUCCESS] openclaw_global_swarm.py has been upgraded to Dynamic Autonomy.")
