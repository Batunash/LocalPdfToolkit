//! Application state management

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::RwLock;
use localpdf_core::utils::TempDir;

/// Active job handle
#[allow(dead_code)]
pub struct JobHandle {
    pub id: String,
    pub status: RwLock<String>,
    pub progress: RwLock<f32>,
}

/// Application-wide state
#[allow(dead_code)]
pub struct AppState {
    pub active_jobs: RwLock<HashMap<String, JobHandle>>,
    pub temp_dir: RwLock<Option<TempDir>>,
    pub settings: RwLock<AppSettings>,
    pub ocr_lang: RwLock<String>,
}

/// App settings
#[derive(Clone, Default)]
#[allow(dead_code)]
pub struct AppSettings {
    pub default_output_dir: Option<PathBuf>,
    pub compression_level: String,
    pub ocr_language: String,
    pub auto_update: bool,
    pub theme: String,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            active_jobs: RwLock::new(HashMap::new()),
            temp_dir: RwLock::new(None),
            settings: RwLock::new(AppSettings::default()),
            ocr_lang: RwLock::new("eng".to_string()),
        }
    }
}

impl AppState {
    pub fn create_temp_dir(&self) -> Result<PathBuf, String> {
        let mut temp_guard = self.temp_dir.write().map_err(|e| e.to_string())?;
        if temp_guard.is_none() {
            let temp = TempDir::new("localpdf").map_err(|e| e.to_string())?;
            let path = temp.path().to_path_buf();
            *temp_guard = Some(temp);
            Ok(path)
        } else {
            Ok(temp_guard.as_ref().unwrap().path().to_path_buf())
        }
    }

    #[allow(dead_code)]
    pub fn add_job(&self, id: String) {
        let mut jobs = self.active_jobs.write().unwrap();
        jobs.insert(id.clone(), JobHandle {
            id,
            status: RwLock::new("pending".to_string()),
            progress: RwLock::new(0.0),
        });
    }

    #[allow(dead_code)]
    pub fn update_job_progress(&self, id: &str, progress: f32, status: &str) {
        let jobs = self.active_jobs.read().unwrap();
        if let Some(job) = jobs.get(id) {
            *job.progress.write().unwrap() = progress;
            *job.status.write().unwrap() = status.to_string();
        }
    }

    #[allow(dead_code)]
    pub fn complete_job(&self, id: &str) {
        self.update_job_progress(id, 100.0, "complete");
    }

    #[allow(dead_code)]
    pub fn remove_job(&self, id: &str) {
        let mut jobs = self.active_jobs.write().unwrap();
        jobs.remove(id);
    }
}