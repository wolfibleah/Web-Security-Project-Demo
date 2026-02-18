import sys
import os
import re
import json
import csv
from pathlib import Path
from collections import defaultdict
from datetime import datetime
import time

class LogAnalyzer:
    LOG_FORMAT_CUSTOM = 'custom'
    LOG_FORMAT_APACHE_CLF = 'apache_clf'
    LOG_FORMAT_GOOGLE_CSV = 'google_csv'
    LOG_FORMAT_GOOGLE_JSON = 'google_json'
    
    def __init__(self, log_file='server.log', log_format=None):
        self.log_file = log_file
        self.logs = []
        self.detected_format = log_format or self.auto_detect_format()
        
    def auto_detect_format(self):
        """Auto-detect log format from file"""
        if not os.path.exists(self.log_file):
            print(f"Error: Log file '{self.log_file}' not found!")
            return None
        
        try:
            with open(self.log_file, 'r', encoding='utf-8') as f:
                first_line = f.readline().strip()
                
                if not first_line:
                    return self.LOG_FORMAT_CUSTOM
                
                # Check for JSON format
                if first_line.startswith('{'):
                    return self.LOG_FORMAT_GOOGLE_JSON
                
                # Check for CSV format (Google Cloud)
                if ',' in first_line and not first_line.startswith('['):
                    return self.LOG_FORMAT_GOOGLE_CSV
                
                # Check for Apache CLF format (IP at start, datetime in brackets)
                if re.match(r'^\d+\.\d+\.\d+\.\d+.*\[.*\]', first_line):
                    return self.LOG_FORMAT_APACHE_CLF
                
                # Check for custom format (timestamp in brackets)
                if first_line.startswith('['):
                    return self.LOG_FORMAT_CUSTOM
                
        except Exception as e:
            print(f"Error detecting format: {e}")
        
        return self.LOG_FORMAT_CUSTOM
    
    def parse_log_line_custom(self, line):
        """Parse custom server log format"""
        log_pattern_new = r'\[([^\]]+)\]\s+(\w+)\s+(\S+)\s+-\s+(\d+)\s+-\s+IP:\s+([^\s]+)'
        log_pattern_old = r'\[([^\]]+)\]\s+(\w+)\s+(\S+)\s+-\s+(\d+)(?:\s+-\s+(.+))?'
        
        match = re.search(log_pattern_new, line)
        if match:
            timestamp, method, url, status_code, ip = match.groups()
            return {
                'timestamp': timestamp,
                'method': method,
                'url': url,
                'status_code': int(status_code),
                'ip': ip,
                'raw_line': line,
                'format': self.LOG_FORMAT_CUSTOM
            }
        
        match = re.search(log_pattern_old, line)
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
                'raw_line': line,
                'format': self.LOG_FORMAT_CUSTOM
            }
        return None
    
    def parse_log_line_apache_clf(self, line):
        """Parse Apache Common Log Format"""
        pattern = r'(\S+)\s+-\s+(\S+)\s+\[([^\]]+)\]\s+"(\w+)\s+(\S+)\s+\S+"\s+(\d+)\s+(\d+|-)'
        match = re.search(pattern, line)
        if match:
            ip, user, timestamp, method, url, status_code, bytes_sent = match.groups()
            return {
                'timestamp': timestamp,
                'method': method,
                'url': url,
                'status_code': int(status_code),
                'ip': ip,
                'user': user,
                'bytes_sent': bytes_sent,
                'raw_line': line,
                'format': self.LOG_FORMAT_APACHE_CLF
            }
        return None
    
    def parse_log_line_google_csv(self, line, headers=None):
        """Parse Google Cloud CSV log format"""
        try:
            reader = csv.DictReader([line], fieldnames=headers or [])
            row = next(reader)
            
            # Extract relevant fields from Google Cloud CSV
            timestamp = row.get('timestamp', '')
            status_code = int(row.get('httpRequest.status', 200)) if 'httpRequest.status' in row else 200
            url = row.get('httpRequest.requestUrl', '')
            method = row.get('httpRequest.requestMethod', 'GET')
            ip = row.get('httpRequest.userIp', 'Unknown')
            
            return {
                'timestamp': timestamp,
                'method': method,
                'url': url,
                'status_code': status_code,
                'ip': ip,
                'raw_line': line,
                'format': self.LOG_FORMAT_GOOGLE_CSV
            }
        except Exception:
            return None
    
    def parse_log_line_google_json(self, line):
        """Parse Google Cloud JSON log format"""
        try:
            data = json.loads(line)
            
            # Extract HTTP request info
            http_req = data.get('httpRequest', {})
            timestamp = data.get('timestamp', '')
            severity = data.get('severity', 'DEFAULT')
            
            status_code = http_req.get('status', 200)
            method = http_req.get('requestMethod', 'GET')
            url = http_req.get('requestUrl', '')
            ip = http_req.get('userIp', 'Unknown')
            
            return {
                'timestamp': timestamp,
                'method': method,
                'url': url,
                'status_code': int(status_code) if status_code else 200,
                'ip': ip,
                'severity': severity,
                'raw_line': line,
                'format': self.LOG_FORMAT_GOOGLE_JSON
            }
        except Exception:
            return None
    
    def parse_log_line(self, line):
        """Parse a log line based on detected format"""
        if self.detected_format == self.LOG_FORMAT_APACHE_CLF:
            return self.parse_log_line_apache_clf(line)
        elif self.detected_format == self.LOG_FORMAT_GOOGLE_CSV:
            return self.parse_log_line_google_csv(line)
        elif self.detected_format == self.LOG_FORMAT_GOOGLE_JSON:
            return self.parse_log_line_google_json(line)
        else:
            return self.parse_log_line_custom(line)
    
    def read_logs(self):
        """Read and parse all logs from file"""
        self.logs = []
        if not os.path.exists(self.log_file):
            print(f"Error: Log file '{self.log_file}' not found!")
            return False
        
        try:
            with open(self.log_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line:
                        parsed = self.parse_log_line(line)
                        if parsed:
                            self.logs.append(parsed)
            
            if not self.logs:
                print(f"Warning: No logs parsed. Detected format: {self.detected_format}")
                return False
            
            return True
        except Exception as e:
            print(f"Error reading log file: {e}")
            return False
    
    def analyze_4xx_errors(self):
        """Functionality 1: Display URLs and IPs for 4xx errors"""
        print("\n" + "="*90)
        print("ANALYSIS 1: URLs and IPs for 4xx Response Codes")
        print(f"Format detected: {self.detected_format}")
        print("="*90 + "\n")
        
        errors_4xx = [log for log in self.logs if 400 <= log.get('status_code', 0) < 500]
        
        if not errors_4xx:
            print("No 4xx errors found in logs.\n")
            return
        
        print(f"Total 4xx errors found: {len(errors_4xx)}\n")
        print(f"{'Status':<8} {'IP Address':<20} {'Method':<8} {'URL':<50}")
        print("-" * 90)
        
        for log in errors_4xx:
            status = log.get('status_code', 'N/A')
            ip = log.get('ip', 'Unknown')
            method = log.get('method', 'N/A')
            url = log.get('url', 'N/A')[:49]
            print(f"{status:<8} {ip:<20} {method:<8} {url:<50}")
        
        print("\n")
    
    def analyze_unique_urls(self):
        """Functionality 2: Display unique URLs with access count and response codes"""
        print("="*100)
        print("ANALYSIS 2: Unique URLs with Access Count and Response Codes")
        print(f"Format detected: {self.detected_format}")
        print("="*100 + "\n")
        
        url_stats = defaultdict(lambda: {'count': 0, 'status_codes': defaultdict(int)})
        
        for log in self.logs:
            url = log.get('url', 'N/A')
            status_code = log.get('status_code', 0)
            url_stats[url]['count'] += 1
            url_stats[url]['status_codes'][status_code] += 1
        
        print(f"Total unique URLs: {len(url_stats)}\n")
        print(f"{'URL':<55} {'Access Count':<15} {'Status Codes':<30}")
        print("-" * 100)
        
        sorted_urls = sorted(url_stats.items(), key=lambda x: x[1]['count'], reverse=True)
        
        for url, stats in sorted_urls[:50]:  # Show top 50
            count = stats['count']
            status_codes = ', '.join([f"{code}({cnt})" for code, cnt in sorted(stats['status_codes'].items())])
            url_display = url[:54]
            print(f"{url_display:<55} {count:<15} {status_codes:<30}")
        
        print(f"\nTotal HTTP requests: {len(self.logs)}\n")
    
    def real_time_monitoring(self):
        """Functionality 3: Monitor log file in real-time"""
        print("\n" + "="*90)
        print("ANALYSIS 3: Real-Time Monitoring of 4xx Errors")
        print(f"Format detected: {self.detected_format}")
        print("="*90)
        print("Watching for new log entries... (Press Ctrl+C to stop)\n")
        
        try:
            current_size = os.path.getsize(self.log_file)
        except OSError:
            print("Error: Cannot access log file")
            return
        
        error_count = 0
        
        try:
            while True:
                try:
                    file_size = os.path.getsize(self.log_file)
                    
                    if file_size > current_size:
                        with open(self.log_file, 'r', encoding='utf-8') as f:
                            f.seek(current_size)
                            new_lines = f.read()
                            current_size = file_size
                            
                            for line in new_lines.split('\n'):
                                if line.strip():
                                    parsed = self.parse_log_line(line.strip())
                                    if parsed and 400 <= parsed.get('status_code', 0) < 500:
                                        error_count += 1
                                        status = parsed.get('status_code')
                                        ip = parsed.get('ip', 'Unknown')
                                        url = parsed.get('url', 'N/A')[:60]
                                        method = parsed.get('method', 'N/A')
                                        timestamp = parsed.get('timestamp', '')
                                        
                                        print(f"[NEW ERROR #{error_count}] {timestamp}")
                                        print(f"  Method: {method} | Status: {status} | IP: {ip}")
                                        print(f"  URL: {url}\n")
                    
                    time.sleep(1)
                    
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
        print(f"[*] Detected format: {self.detected_format}")
        
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
            Enhanced Web Server Log Analyzer v2.0                       
              Supports Multiple Log Formats                                 


SUPPORTED FORMATS: 
  • Custom server logs 
  • Apache Common Log Format (CLF) - Wordpress/PHP  
  • Google Cloud Logs (CSV)
  • Google Cloud Logs (JSON)

USAGE:
  python logs_analyzer_v2.py <mode> [log_file] [log_format]

MODES:
  1 - Analyze 4xx errors (URL + IP source)
  2 - Analyze unique URLs with access count
  3 - Real-time monitoring of new 4xx errors
  all  - Run all analyses (1, 2, and 3)

ARGUMENTS:
  log_file              - Path to log file (default: server.log)
  log_format            - Force log format detection:
                          custom, apache_clf, google_csv, google_json
"""
        print(help_text)


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ['help', '-h', '--help']:
        analyzer = LogAnalyzer()
        analyzer.show_help()
        return
    
    mode = sys.argv[1]
    log_file = sys.argv[2] if len(sys.argv) > 2 else 'server.log'
    log_format = sys.argv[3] if len(sys.argv) > 3 else None
    
    analyzer = LogAnalyzer(log_file, log_format)
    analyzer.run(mode)


if __name__ == '__main__':
    main()
