import sys
import os
import re
from pathlib import Path
from collections import defaultdict
import time
import threading

class LogAnalyzer:
    def __init__(self, log_file='server.log'):
        self.log_file = log_file
        self.log_pattern_new = r'\[([^\]]+)\]\s+(\w+)\s+(\S+)\s+-\s+(\d+)\s+-\s+IP:\s+([^\s]+)'
        self.log_pattern_old = r'\[([^\]]+)\]\s+(\w+)\s+(\S+)\s+-\s+(\d+)(?:\s+-\s+(.+))?'
        self.logs = []
        
    def parse_log_line(self, line):
        """Parse a single log line - supports both old and new formats"""
        match = re.search(self.log_pattern_new, line)
        if match:
            timestamp, method, url, status_code, ip = match.groups()
            return {
                'timestamp': timestamp,
                'method': method,
                'url': url,
                'status_code': int(status_code),
                'ip': ip,
                'raw_line': line
            }
        

        match = re.search(self.log_pattern_old, line)
        if match:
            timestamp, method, url, status_code, ip_or_extra = match.groups()
            ip = ip_or_extra if ip_or_extra else "Unknown"
            ip_match = re.search(r'(\S+)$', ip_or_extra) if ip_or_extra else None
            if ip_match:
                ip = ip_match.group(1)
            
            return {
                'timestamp': timestamp,
                'method': method,
                'url': url,
                'status_code': int(status_code),
                'ip': ip,
                'raw_line': line
            }
        return None
    
    def read_logs(self):
        """Read and parse all logs from file"""
        self.logs = []
        if not os.path.exists(self.log_file):
            print(f"Error: Log file '{self.log_file}' not found!")
            return False
        
        try:
            with open(self.log_file, 'r', encoding='utf-8') as f:
                for line in f:
                    parsed = self.parse_log_line(line.strip())
                    if parsed:
                        self.logs.append(parsed)
            return True
        except Exception as e:
            print(f"Error reading log file: {e}")
            return False
    
    def analyze_4xx_errors(self):
        """Functionality 1: Display URLs and IPs for 4xx errors"""
        print("\n" + "="*80)
        print("ANALYSIS 1: URLs and IPs for 4xx Response Codes")
        print("="*80 + "\n")
        
        errors_4xx = [log for log in self.logs if 400 <= log['status_code'] < 500]
        
        if not errors_4xx:
            print("No 4xx errors found in logs.\n")
            return
        
        print(f"Total 4xx errors found: {len(errors_4xx)}\n")
        print(f"{'Status':<8} {'IP Address':<20} {'URL':<50} {'Method':<8}")
        print("-" * 86)
        
        for log in errors_4xx:
            status = log['status_code']
            ip = log['ip']
            url = log['url'][:49]  # Truncate long URLs
            method = log['method']
            print(f"{status:<8} {ip:<20} {url:<50} {method:<8}")
        
        print("\n")
    
    def analyze_unique_urls(self):
        """Functionality 2: Display unique URLs with access count and response codes"""
        print("="*80)
        print("ANALYSIS 2: Unique URLs with Access Count and Response Codes")
        print("="*80 + "\n")
        
        url_stats = defaultdict(lambda: {'count': 0, 'status_codes': defaultdict(int)})
        
        for log in self.logs:
            url = log['url']
            url_stats[url]['count'] += 1
            url_stats[url]['status_codes'][log['status_code']] += 1
        
        print(f"Total unique URLs: {len(url_stats)}\n")
        print(f"{'URL':<50} {'Access Count':<15} {'Status Codes':<30}")
        print("-" * 95)
        
        sorted_urls = sorted(url_stats.items(), key=lambda x: x[1]['count'], reverse=True)
        
        for url, stats in sorted_urls:
            count = stats['count']
            status_codes = ', '.join([f"{code}({cnt})" for code, cnt in sorted(stats['status_codes'].items())])
            url_display = url[:49]
            print(f"{url_display:<50} {count:<15} {status_codes:<30}")
        
        print(f"\nTotal HTTP requests: {len(self.logs)}\n")
    
    def real_time_monitoring(self):
        """Functionality 3: Monitor log file in real-time"""
        print("\n" + "="*80)
        print("ANALYSIS 3: Real-Time Monitoring of 4xx Errors")
        print("="*80)
        print("Watching for new log entries... (Press Ctrl+C to stop)\n")
        
        try:
            current_size = os.path.getsize(self.log_file)
        except OSError:
            print("Error: Cannot access log file")
            return
        
        monitored_errors = []
        error_count = 0
        
        try:
            while True:
                try:
                    file_size = os.path.getsize(self.log_file)
                    
                    # If file size increased, new logs were added
                    if file_size > current_size:
                        with open(self.log_file, 'r', encoding='utf-8') as f:
                            f.seek(current_size)
                            new_lines = f.read()
                            current_size = file_size
                            
                            # Parse new lines
                            for line in new_lines.split('\n'):
                                if line.strip():
                                    parsed = self.parse_log_line(line.strip())
                                    if parsed and 400 <= parsed['status_code'] < 500:
                                        error_count += 1
                                        monitored_errors.append(parsed)
                                        
                                        # Display new 4xx error
                                        status = parsed['status_code']
                                        ip = parsed['ip']
                                        url = parsed['url'][:60]
                                        method = parsed['method']
                                        timestamp = parsed['timestamp']
                                        
                                        print(f"[NEW ERROR #{error_count}] {timestamp}")
                                        print(f"  Method: {method} | Status: {status} | IP: {ip}")
                                        print(f"  URL: {url}\n")
                    
                    time.sleep(1)  # Check every second
                    
                except OSError:
                    pass
                    
        except KeyboardInterrupt:
            print(f"\n\nMonitoring stopped. Total 4xx errors detected: {error_count}\n")
    
    def run(self, mode=None):
        """Run analyzer based on selected mode"""
        if mode is None:
            self.show_help()
            return
        
        print(f"\n[*] Analyzing log file: {self.log_file}")
        
        if mode in ['1', 'mode1', '4xx']:
            if self.read_logs():
                self.analyze_4xx_errors()
        
        elif mode in ['2', 'mode2', 'unique']:
            if self.read_logs():
                self.analyze_unique_urls()
        
        elif mode in ['3', 'mode3', 'realtime', 'real-time']:
            self.real_time_monitoring()
        
        elif mode == 'all':
            if self.read_logs():
                self.analyze_4xx_errors()
                self.analyze_unique_urls()
            self.real_time_monitoring()
        
        else:
            print(f"Unknown mode: {mode}")
            self.show_help()
    
    def show_help(self):
        """Display usage information"""
        help_text = """
        Log Analyzer for Web Server Logs

USAGE:
  python logs_analyzer.py <mode> [log_file]

MODES:
  1 - Analyze 4xx errors (URL + IP source)
  2 - Analyze unique URLs with access count
  3 - Real-time monitoring of new 4xx errors
all - Run all analyses (1, 2, and 3)

ARGUMENTS:
  log_file              - Path to log file (default: server.log)

"""
        print(help_text)


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ['help', '-h', '--help']:
        analyzer = LogAnalyzer()
        analyzer.show_help()
        return
    
    mode = sys.argv[1]
    log_file = sys.argv[2] if len(sys.argv) > 2 else 'server.log'
    
    analyzer = LogAnalyzer(log_file)
    analyzer.run(mode)


if __name__ == '__main__':
    main()

