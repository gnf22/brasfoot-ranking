import os
import re

def fix_imports(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Replace import { Model } with import type { Model }
                # Only targeting imports from '../models' or '../../models'
                new_content = re.sub(
                    r'import \{ ([^}]+) \} from \'(\.\./)+models\';',
                    r'import type { \1 } from \'\2models\';',
                    content
                )
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed {filepath}")

fix_imports('src')
