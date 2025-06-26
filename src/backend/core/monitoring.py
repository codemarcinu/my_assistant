"""
Monitoring System for FoodSave AI

This module provides monitoring capabilities including:
- Performance metrics collection
- Health checks for services
- Alerting system
- Dashboard endpoints
- System metrics monitoring
"""

import asyncio
import time
import logging
import psutil
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass
from enum import Enum
from collections import defaultdict, deque
import threading
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

class MetricType(Enum):
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"

class AlertSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class Metric:
    name: str
    value: float
    type: MetricType
    labels: Dict[str, str]
    timestamp: datetime

@dataclass
class Alert:
    id: str
    title: str
    message: str
    severity: AlertSeverity
    source: str
    timestamp: datetime
    resolved: bool = False
    resolved_at: Optional[datetime] = None

@dataclass
class HealthCheck:
    name: str
    status: str
    response_time: float
    last_check: datetime
    error_message: Optional[str] = None

class MonitoringSystem:
    """Central monitoring system for FoodSave AI."""
    
    def __init__(self):
        self.metrics: deque = deque(maxlen=5000)
        self.alerts: List[Alert] = []
        self.health_checks: Dict[str, HealthCheck] = {}
        self.alert_handlers: List[Callable] = []
        self.monitoring_enabled = True
        self._lock = threading.Lock()
        self._start_time = datetime.now()
        
        # Performance tracking
        self.request_times: deque = deque(maxlen=500)
        self.error_counts: Dict[str, int] = defaultdict(int)
        self.cache_hit_rates: Dict[str, float] = defaultdict(float)
        
        # System metrics
        self.system_metrics = {
            'cpu_usage': 0.0,
            'memory_usage': 0.0,
            'disk_usage': 0.0,
            'network_io': {'bytes_sent': 0, 'bytes_recv': 0}
        }
        
        logger.info("Monitoring system initialized")

    async def start_monitoring(self):
        """Start background monitoring tasks."""
        if not self.monitoring_enabled:
            return
            
        logger.info("Starting monitoring system...")
        
        # Start background tasks
        asyncio.create_task(self._run_health_checks())
        asyncio.create_task(self._cleanup_old_data())
        asyncio.create_task(self._collect_system_metrics())
        asyncio.create_task(self._check_alerts())
        
        logger.info("Monitoring system started successfully")

    def record_metric(self, name: str, value: float, metric_type: MetricType = MetricType.GAUGE, 
                     labels: Optional[Dict[str, str]] = None):
        """Record a new metric."""
        if not self.monitoring_enabled:
            return
            
        metric = Metric(
            name=name,
            value=value,
            type=metric_type,
            labels=labels or {},
            timestamp=datetime.now()
        )
        
        with self._lock:
            self.metrics.append(metric)
        
        logger.debug(f"Recorded metric: {name}={value}")

    def record_request_time(self, endpoint: str, method: str, duration: float, status_code: int):
        """Record request performance metrics."""
        self.record_metric(
            name="http_request_duration_seconds",
            value=duration,
            metric_type=MetricType.HISTOGRAM,
            labels={
                "endpoint": endpoint,
                "method": method,
                "status_code": str(status_code)
            }
        )
        
        self.request_times.append({
            'endpoint': endpoint,
            'method': method,
            'duration': duration,
            'status_code': status_code,
            'timestamp': datetime.now()
        })
        
        # Track error rates
        if status_code >= 400:
            self.error_counts[f"{method}_{endpoint}"] += 1

    def record_cache_metric(self, cache_name: str, hit: bool):
        """Record cache performance metrics."""
        if cache_name not in self.cache_hit_rates:
            self.cache_hit_rates[cache_name] = {'hits': 0, 'misses': 0}
        
        if hit:
            self.cache_hit_rates[cache_name]['hits'] += 1
        else:
            self.cache_hit_rates[cache_name]['misses'] += 1
        
        # Calculate hit rate
        total = self.cache_hit_rates[cache_name]['hits'] + self.cache_hit_rates[cache_name]['misses']
        if total > 0:
            hit_rate = self.cache_hit_rates[cache_name]['hits'] / total
            self.record_metric(
                name="cache_hit_rate",
                value=hit_rate,
                metric_type=MetricType.GAUGE,
                labels={"cache": cache_name}
            )

    async def add_health_check(self, name: str, check_func):
        """Add a health check function."""
        self.health_checks[name] = HealthCheck(
            name=name,
            status="unknown",
            response_time=0.0,
            last_check=datetime.now()
        )
        
        setattr(self, f"_check_{name}", check_func)
        logger.info(f"Added health check: {name}")

    async def _run_health_checks(self):
        """Run all health checks periodically."""
        while self.monitoring_enabled:
            try:
                for name in self.health_checks.keys():
                    await self._execute_health_check(name)
                
                await asyncio.sleep(30)
            except Exception as e:
                logger.error(f"Error running health checks: {e}")
                await asyncio.sleep(60)

    async def _execute_health_check(self, name: str):
        """Execute a specific health check."""
        try:
            start_time = time.time()
            check_func = getattr(self, f"_check_{name}", None)
            
            if check_func:
                if asyncio.iscoroutinefunction(check_func):
                    result = await check_func()
                else:
                    result = check_func()
                
                response_time = time.time() - start_time
                
                self.health_checks[name] = HealthCheck(
                    name=name,
                    status="healthy" if result else "unhealthy",
                    response_time=response_time,
                    last_check=datetime.now(),
                    error_message=None if result else f"Health check {name} failed"
                )
                
        except Exception as e:
            logger.error(f"Error executing health check {name}: {e}")
            self.health_checks[name] = HealthCheck(
                name=name,
                status="unhealthy",
                response_time=0.0,
                last_check=datetime.now(),
                error_message=str(e)
            )

    async def _collect_system_metrics(self):
        """Collect system-level metrics."""
        while self.monitoring_enabled:
            try:
                # CPU usage
                cpu_percent = psutil.cpu_percent(interval=1)
                self.record_metric("system_cpu_usage", cpu_percent, MetricType.GAUGE)
                
                # Memory usage
                memory = psutil.virtual_memory()
                self.record_metric("system_memory_usage", memory.percent, MetricType.GAUGE)
                
                # Disk usage
                disk = psutil.disk_usage('/')
                disk_percent = (disk.used / disk.total) * 100
                self.record_metric("system_disk_usage", disk_percent, MetricType.GAUGE)
                
                # Network I/O
                network = psutil.net_io_counters()
                self.record_metric("system_network_bytes_sent", network.bytes_sent, MetricType.COUNTER)
                self.record_metric("system_network_bytes_recv", network.bytes_recv, MetricType.COUNTER)
                
                await asyncio.sleep(60)  # Collect every minute
                
            except Exception as e:
                logger.error(f"Error collecting system metrics: {e}")
                await asyncio.sleep(120)

    def create_alert(self, title: str, message: str, severity: AlertSeverity, source: str):
        """Create a new alert."""
        alert = Alert(
            id=f"{source}_{int(time.time())}",
            title=title,
            message=message,
            severity=severity,
            source=source,
            timestamp=datetime.now()
        )
        
        with self._lock:
            self.alerts.append(alert)
        
        logger.warning(f"Alert created: {title} ({severity.value})")
        
        # Trigger alert handlers
        asyncio.create_task(self._trigger_alert_handlers(alert))

    def add_alert_handler(self, handler: Callable):
        """Add an alert handler function."""
        self.alert_handlers.append(handler)
        logger.info(f"Added alert handler: {handler.__name__}")

    async def _trigger_alert_handlers(self, alert: Alert):
        """Trigger all registered alert handlers."""
        for handler in self.alert_handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(alert)
                else:
                    handler(alert)
            except Exception as e:
                logger.error(f"Error in alert handler: {e}")

    async def _check_alerts(self):
        """Check for conditions that should trigger alerts."""
        while self.monitoring_enabled:
            try:
                # Check error rates
                for endpoint, count in self.error_counts.items():
                    if count > 10:  # Alert if more than 10 errors
                        self.create_alert(
                            title=f"High Error Rate: {endpoint}",
                            message=f"Endpoint {endpoint} has {count} errors",
                            severity=AlertSeverity.HIGH,
                            source="error_monitoring"
                        )
                
                # Check system metrics
                recent_metrics = [m for m in self.metrics if 
                                m.timestamp > datetime.now() - timedelta(minutes=5)]
                
                cpu_metrics = [m for m in recent_metrics if m.name == "system_cpu_usage"]
                if cpu_metrics and any(m.value > 80 for m in cpu_metrics):
                    self.create_alert(
                        title="High CPU Usage",
                        message="CPU usage is above 80%",
                        severity=AlertSeverity.MEDIUM,
                        source="system_monitoring"
                    )
                
                memory_metrics = [m for m in recent_metrics if m.name == "system_memory_usage"]
                if memory_metrics and any(m.value > 90 for m in memory_metrics):
                    self.create_alert(
                        title="High Memory Usage",
                        message="Memory usage is above 90%",
                        severity=AlertSeverity.HIGH,
                        source="system_monitoring"
                    )
                
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                logger.error(f"Error checking alerts: {e}")
                await asyncio.sleep(600)

    async def _cleanup_old_data(self):
        """Clean up old metrics and alerts."""
        while self.monitoring_enabled:
            try:
                cutoff_time = datetime.now() - timedelta(hours=24)
                
                # Clean up old metrics
                with self._lock:
                    self.metrics = deque(
                        [m for m in self.metrics if m.timestamp > cutoff_time],
                        maxlen=5000
                    )
                
                # Clean up old alerts (keep last 50)
                with self._lock:
                    self.alerts = self.alerts[-50:]
                
                # Clean up old request times
                self.request_times = deque(
                    [r for r in self.request_times if r['timestamp'] > cutoff_time],
                    maxlen=500
                )
                
                await asyncio.sleep(3600)  # Clean up every hour
                
            except Exception as e:
                logger.error(f"Error cleaning up old data: {e}")
                await asyncio.sleep(7200)

    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get a summary of current metrics."""
        with self._lock:
            recent_metrics = [m for m in self.metrics if 
                            m.timestamp > datetime.now() - timedelta(hours=1)]
            
            summary = {
                'total_metrics': len(self.metrics),
                'recent_metrics': len(recent_metrics),
                'active_alerts': len([a for a in self.alerts if not a.resolved]),
                'health_checks': {
                    name: {
                        'status': check.status,
                        'response_time': check.response_time,
                        'last_check': check.last_check.isoformat()
                    }
                    for name, check in self.health_checks.items()
                },
                'uptime': (datetime.now() - self._start_time).total_seconds(),
                'system_metrics': self.system_metrics,
                'cache_performance': {
                    name: {
                        'hit_rate': (data['hits'] / (data['hits'] + data['misses'])) if (data['hits'] + data['misses']) > 0 else 0,
                        'total_requests': data['hits'] + data['misses']
                    }
                    for name, data in self.cache_hit_rates.items()
                }
            }
            
            return summary

    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics."""
        if not self.request_times:
            return {'message': 'No request data available'}
        
        recent_requests = [r for r in self.request_times if 
                          r['timestamp'] > datetime.now() - timedelta(minutes=5)]
        
        if not recent_requests:
            return {'message': 'No recent request data'}
        
        durations = [r['duration'] for r in recent_requests]
        
        return {
            'total_requests': len(recent_requests),
            'average_response_time': sum(durations) / len(durations),
            'min_response_time': min(durations),
            'max_response_time': max(durations),
            'error_rate': len([r for r in recent_requests if r['status_code'] >= 400]) / len(recent_requests),
            'requests_per_minute': len(recent_requests) / 5,
            'endpoint_performance': self._get_endpoint_performance(recent_requests)
        }

    def _get_endpoint_performance(self, requests: List[Dict]) -> Dict[str, Any]:
        """Get performance breakdown by endpoint."""
        endpoint_stats = defaultdict(lambda: {'count': 0, 'total_time': 0, 'errors': 0})
        
        for request in requests:
            endpoint = request['endpoint']
            endpoint_stats[endpoint]['count'] += 1
            endpoint_stats[endpoint]['total_time'] += request['duration']
            if request['status_code'] >= 400:
                endpoint_stats[endpoint]['errors'] += 1
        
        return {
            endpoint: {
                'count': stats['count'],
                'average_time': stats['total_time'] / stats['count'],
                'error_rate': stats['errors'] / stats['count']
            }
            for endpoint, stats in endpoint_stats.items()
        }

    def resolve_alert(self, alert_id: str):
        """Resolve an alert."""
        with self._lock:
            for alert in self.alerts:
                if alert.id == alert_id and not alert.resolved:
                    alert.resolved = True
                    alert.resolved_at = datetime.now()
                    logger.info(f"Alert resolved: {alert_id}")
                    break

# Global monitoring instance
monitoring = MonitoringSystem()

# Memory profiling context manager
@asynccontextmanager
async def async_memory_profiling_context(operation_name: str = "operation"):
    """
    Context manager for async memory profiling.
    
    Args:
        operation_name: Name of the operation being profiled
    """
    process = psutil.Process()
    start_memory = process.memory_info().rss
    start_time = time.time()
    
    try:
        yield
    finally:
        end_time = time.time()
        end_memory = process.memory_info().rss
        
        duration = end_time - start_time
        memory_diff = end_memory - start_memory
        
        # Record metrics
        monitoring.record_metric(
            name="memory_usage_bytes",
            value=end_memory,
            metric_type=MetricType.GAUGE,
            labels={"operation": operation_name}
        )
        
        monitoring.record_metric(
            name="memory_delta_bytes",
            value=memory_diff,
            metric_type=MetricType.GAUGE,
            labels={"operation": operation_name}
        )
        
        monitoring.record_metric(
            name="operation_duration_seconds",
            value=duration,
            metric_type=MetricType.HISTOGRAM,
            labels={"operation": operation_name}
        )
        
        logger.debug(f"Memory profiling for {operation_name}: "
                    f"duration={duration:.3f}s, "
                    f"memory_diff={memory_diff/1024/1024:.2f}MB")
