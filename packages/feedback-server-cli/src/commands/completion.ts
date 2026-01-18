/**
 * Shell Completion Command
 *
 * Generate shell completion scripts for bash, zsh, fish, and PowerShell.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { logger } from '../utils/logger.js';

const BASH_COMPLETION = `
# feedback-cli bash completion
# Add to ~/.bashrc or ~/.bash_completion

_feedback_cli_completion() {
    local cur prev commands
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

    # Top-level commands
    commands="feedback auth config export help"

    # Subcommands
    feedback_commands="list get create update delete stats"
    auth_commands="login logout whoami"
    config_commands="list get set reset"
    export_commands=""

    case "\${COMP_WORDS[1]}" in
        feedback)
            COMPREPLY=( \$(compgen -W "\${feedback_commands}" -- \${cur}) )
            return 0
            ;;
        auth)
            COMPREPLY=( \$(compgen -W "\${auth_commands}" -- \${cur}) )
            return 0
            ;;
        config)
            COMPREPLY=( \$(compgen -W "\${config_commands}" -- \${cur}) )
            return 0
            ;;
        export)
            case "\${prev}" in
                --format|-f)
                    COMPREPLY=( \$(compgen -W "json csv markdown" -- \${cur}) )
                    return 0
                    ;;
                --status)
                    COMPREPLY=( \$(compgen -W "open in_progress resolved closed" -- \${cur}) )
                    return 0
                    ;;
            esac
            COMPREPLY=( \$(compgen -W "--format --output --status --limit --from --to" -- \${cur}) )
            return 0
            ;;
    esac

    if [[ \${cur} == -* ]] ; then
        COMPREPLY=( \$(compgen -W "--help --version --debug --no-color --output --server" -- \${cur}) )
        return 0
    fi

    COMPREPLY=( \$(compgen -W "\${commands}" -- \${cur}) )
    return 0
}

complete -F _feedback_cli_completion feedback-cli
`.trim();

const ZSH_COMPLETION = `
#compdef feedback-cli

# feedback-cli zsh completion
# Add to ~/.zshrc or place in fpath as _feedback-cli

_feedback-cli() {
    local -a commands feedback_commands auth_commands config_commands export_options

    commands=(
        'feedback:Manage feedback items'
        'auth:Authentication commands'
        'config:Configuration management'
        'export:Export feedback data'
        'help:Display help for commands'
    )

    feedback_commands=(
        'list:List all feedback items'
        'get:Get feedback by ID'
        'create:Create new feedback'
        'update:Update existing feedback'
        'delete:Delete feedback'
        'stats:Show feedback statistics'
    )

    auth_commands=(
        'login:Authenticate with the server'
        'logout:Clear authentication'
        'whoami:Show current user'
    )

    config_commands=(
        'list:List all config values'
        'get:Get a config value'
        'set:Set a config value'
        'reset:Reset config to defaults'
    )

    _arguments -C \\
        '(-h --help)'{-h,--help}'[Show help information]' \\
        '(-v --version)'{-v,--version}'[Show version number]' \\
        '(-d --debug)'{-d,--debug}'[Enable debug output]' \\
        '--no-color[Disable colored output]' \\
        '(-o --output)'{-o,--output}'[Output format]:format:(json yaml table)' \\
        '(-s --server)'{-s,--server}'[Server URL]:url:' \\
        '1:command:->command' \\
        '*::arg:->args'

    case "$state" in
        command)
            _describe -t commands 'feedback-cli commands' commands
            ;;
        args)
            case "\${words[1]}" in
                feedback)
                    _describe -t feedback_commands 'feedback commands' feedback_commands
                    ;;
                auth)
                    _describe -t auth_commands 'auth commands' auth_commands
                    ;;
                config)
                    _describe -t config_commands 'config commands' config_commands
                    ;;
                export)
                    _arguments \\
                        '(-f --format)'{-f,--format}'[Export format]:format:(json csv markdown)' \\
                        '(-o --output)'{-o,--output}'[Output file]:file:_files' \\
                        '--status[Filter by status]:status:(open in_progress resolved closed)' \\
                        '--limit[Limit results]:number:' \\
                        '--from[Start date]:date:' \\
                        '--to[End date]:date:'
                    ;;
            esac
            ;;
    esac
}

_feedback-cli "$@"
`.trim();

const FISH_COMPLETION = `
# feedback-cli fish completion
# Save to ~/.config/fish/completions/feedback-cli.fish

# Disable file completions for the entire command
complete -c feedback-cli -f

# Global options
complete -c feedback-cli -s h -l help -d 'Show help information'
complete -c feedback-cli -s v -l version -d 'Show version number'
complete -c feedback-cli -s d -l debug -d 'Enable debug output'
complete -c feedback-cli -l no-color -d 'Disable colored output'
complete -c feedback-cli -s o -l output -d 'Output format' -xa 'json yaml table'
complete -c feedback-cli -s s -l server -d 'Server URL'

# Main commands
complete -c feedback-cli -n '__fish_use_subcommand' -a feedback -d 'Manage feedback items'
complete -c feedback-cli -n '__fish_use_subcommand' -a auth -d 'Authentication commands'
complete -c feedback-cli -n '__fish_use_subcommand' -a config -d 'Configuration management'
complete -c feedback-cli -n '__fish_use_subcommand' -a export -d 'Export feedback data'
complete -c feedback-cli -n '__fish_use_subcommand' -a help -d 'Display help for commands'

# Feedback subcommands
complete -c feedback-cli -n '__fish_seen_subcommand_from feedback' -a list -d 'List all feedback items'
complete -c feedback-cli -n '__fish_seen_subcommand_from feedback' -a get -d 'Get feedback by ID'
complete -c feedback-cli -n '__fish_seen_subcommand_from feedback' -a create -d 'Create new feedback'
complete -c feedback-cli -n '__fish_seen_subcommand_from feedback' -a update -d 'Update existing feedback'
complete -c feedback-cli -n '__fish_seen_subcommand_from feedback' -a delete -d 'Delete feedback'
complete -c feedback-cli -n '__fish_seen_subcommand_from feedback' -a stats -d 'Show feedback statistics'

# Auth subcommands
complete -c feedback-cli -n '__fish_seen_subcommand_from auth' -a login -d 'Authenticate with the server'
complete -c feedback-cli -n '__fish_seen_subcommand_from auth' -a logout -d 'Clear authentication'
complete -c feedback-cli -n '__fish_seen_subcommand_from auth' -a whoami -d 'Show current user'

# Config subcommands
complete -c feedback-cli -n '__fish_seen_subcommand_from config' -a list -d 'List all config values'
complete -c feedback-cli -n '__fish_seen_subcommand_from config' -a get -d 'Get a config value'
complete -c feedback-cli -n '__fish_seen_subcommand_from config' -a set -d 'Set a config value'
complete -c feedback-cli -n '__fish_seen_subcommand_from config' -a reset -d 'Reset config to defaults'

# Export options
complete -c feedback-cli -n '__fish_seen_subcommand_from export' -s f -l format -d 'Export format' -xa 'json csv markdown'
complete -c feedback-cli -n '__fish_seen_subcommand_from export' -s o -l output -d 'Output file' -r
complete -c feedback-cli -n '__fish_seen_subcommand_from export' -l status -d 'Filter by status' -xa 'open in_progress resolved closed'
complete -c feedback-cli -n '__fish_seen_subcommand_from export' -l limit -d 'Limit results'
complete -c feedback-cli -n '__fish_seen_subcommand_from export' -l from -d 'Start date'
complete -c feedback-cli -n '__fish_seen_subcommand_from export' -l to -d 'End date'
`.trim();

const POWERSHELL_COMPLETION = `
# feedback-cli PowerShell completion
# Add to your PowerShell profile: notepad $PROFILE

Register-ArgumentCompleter -Native -CommandName feedback-cli -ScriptBlock {
    param($wordToComplete, $commandAst, $cursorPosition)

    $commands = @{
        '' = @(
            @{ Name = 'feedback'; Description = 'Manage feedback items' }
            @{ Name = 'auth'; Description = 'Authentication commands' }
            @{ Name = 'config'; Description = 'Configuration management' }
            @{ Name = 'export'; Description = 'Export feedback data' }
            @{ Name = 'help'; Description = 'Display help for commands' }
        )
        'feedback' = @(
            @{ Name = 'list'; Description = 'List all feedback items' }
            @{ Name = 'get'; Description = 'Get feedback by ID' }
            @{ Name = 'create'; Description = 'Create new feedback' }
            @{ Name = 'update'; Description = 'Update existing feedback' }
            @{ Name = 'delete'; Description = 'Delete feedback' }
            @{ Name = 'stats'; Description = 'Show feedback statistics' }
        )
        'auth' = @(
            @{ Name = 'login'; Description = 'Authenticate with the server' }
            @{ Name = 'logout'; Description = 'Clear authentication' }
            @{ Name = 'whoami'; Description = 'Show current user' }
        )
        'config' = @(
            @{ Name = 'list'; Description = 'List all config values' }
            @{ Name = 'get'; Description = 'Get a config value' }
            @{ Name = 'set'; Description = 'Set a config value' }
            @{ Name = 'reset'; Description = 'Reset config to defaults' }
        )
    }

    $elements = $commandAst.CommandElements
    $command = ''

    if ($elements.Count -gt 1) {
        $command = $elements[1].Value
    }

    $completions = $commands[$command]
    if (-not $completions) {
        $completions = $commands['']
    }

    $completions | Where-Object { $_.Name -like "$wordToComplete*" } | ForEach-Object {
        [System.Management.Automation.CompletionResult]::new(
            $_.Name,
            $_.Name,
            'ParameterValue',
            $_.Description
        )
    }
}
`.trim();

export function createCompletionCommand(): Command {
  const completion = new Command('completion')
    .description('Generate shell completion scripts')
    .argument('<shell>', 'Shell type: bash, zsh, fish, powershell')
    .option('-o, --output <file>', 'Write completion script to file')
    .action((shell: string, options: { output?: string }) => {
      let script: string;
      let filename: string;

      switch (shell.toLowerCase()) {
        case 'bash':
          script = BASH_COMPLETION;
          filename = 'feedback-cli.bash';
          break;
        case 'zsh':
          script = ZSH_COMPLETION;
          filename = '_feedback-cli';
          break;
        case 'fish':
          script = FISH_COMPLETION;
          filename = 'feedback-cli.fish';
          break;
        case 'powershell':
        case 'pwsh':
          script = POWERSHELL_COMPLETION;
          filename = 'feedback-cli.ps1';
          break;
        default:
          logger.error(`Unknown shell: ${shell}`);
          logger.info('Supported shells: bash, zsh, fish, powershell');
          process.exit(1);
      }

      if (options.output) {
        try {
          writeFileSync(options.output, script + '\n');
          logger.success(`Completion script written to: ${options.output}`);
          printInstallInstructions(shell, options.output);
        } catch (error) {
          logger.error(`Failed to write file: ${options.output}`);
          process.exit(1);
        }
      } else {
        console.log(script);
        console.log('');
        printInstallInstructions(shell, filename);
      }
    });

  return completion;
}

function printInstallInstructions(shell: string, filename: string): void {
  console.log(chalk.cyan('\n📦 Installation Instructions:\n'));

  switch (shell.toLowerCase()) {
    case 'bash':
      console.log(chalk.gray('# Add to ~/.bashrc or ~/.bash_completion'));
      console.log(`source ${filename}`);
      console.log('');
      console.log(chalk.gray('# Or install system-wide:'));
      console.log(`sudo cp ${filename} /etc/bash_completion.d/`);
      break;

    case 'zsh':
      console.log(chalk.gray('# Add to ~/.zshrc'));
      console.log(`source ${filename}`);
      console.log('');
      console.log(chalk.gray('# Or add to fpath:'));
      console.log(`cp ${filename} ~/.zsh/completions/`);
      console.log(`echo 'fpath=(~/.zsh/completions $fpath)' >> ~/.zshrc`);
      console.log(`echo 'autoload -Uz compinit && compinit' >> ~/.zshrc`);
      break;

    case 'fish':
      console.log(chalk.gray('# Copy to fish completions directory'));
      console.log(`cp ${filename} ~/.config/fish/completions/`);
      break;

    case 'powershell':
    case 'pwsh':
      console.log(chalk.gray('# Add to your PowerShell profile'));
      console.log('notepad $PROFILE');
      console.log(chalk.gray('# Then paste the completion script'));
      console.log('');
      console.log(chalk.gray('# Or source directly:'));
      console.log(`. ${filename}`);
      break;
  }

  console.log('');
}
