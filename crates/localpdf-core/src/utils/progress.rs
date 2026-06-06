//! Progress tracking utilities for long-running operations

use crate::types::Progress;

/// Trait for progress callbacks
pub trait ProgressCallback: Send + Sync {
    fn on_progress(&self, progress: Progress);
}

/// No-op progress callback (silently ignores all progress updates)
pub struct NoOpProgress;

impl ProgressCallback for NoOpProgress {
    fn on_progress(&self, _progress: Progress) {
        // Silently ignore
    }
}

/// Thread-safe progress tracker with atomic state
pub struct ProgressTracker {
    current_percent: std::sync::atomic::AtomicU32,
    current_stage: std::sync::RwLock<String>,
    current_message: std::sync::RwLock<String>,
    callbacks: std::sync::RwLock<Vec<Box<dyn ProgressCallback>>>,
}

impl ProgressTracker {
    pub fn new() -> Self {
        Self {
            current_percent: std::sync::atomic::AtomicU32::new(0),
            current_stage: std::sync::RwLock::new("".to_string()),
            current_message: std::sync::RwLock::new("".to_string()),
            callbacks: std::sync::RwLock::new(Vec::new()),
        }
    }

    pub fn add_callback<C: ProgressCallback + 'static>(&self, callback: C) {
        self.callbacks.write().unwrap().push(Box::new(callback));
    }

    pub fn update(&self, percent: f32, stage: &str, message: &str) {
        *self.current_stage.write().unwrap() = stage.to_string();
        *self.current_message.write().unwrap() = message.to_string();
        self.current_percent.store((percent * 100.0) as u32, std::sync::atomic::Ordering::SeqCst);

        let progress = Progress::new(percent, message, stage);

        for callback in self.callbacks.read().unwrap().iter() {
            callback.on_progress(progress.clone());
        }
    }

    pub fn current_percent(&self) -> f32 {
        self.current_percent.load(std::sync::atomic::Ordering::SeqCst) as f32 / 100.0
    }

    pub fn current_stage(&self) -> String {
        self.current_stage.read().unwrap().clone()
    }

    pub fn current_message(&self) -> String {
        self.current_message.read().unwrap().clone()
    }
}

impl Default for ProgressTracker {
    fn default() -> Self {
        Self::new()
    }
}