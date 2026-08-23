use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use std::fs;
use std::panic;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, AppHandle,
};
use active_win_pos_rs::get_active_window;
use serde::{Deserialize, Serialize};
use chrono::Local;

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct UsageData {
    // String Date (YYYY-MM-DD) -> (App Name -> Seconds)
    pub daily_usage: HashMap<String, HashMap<String, u64>>,
}

pub struct AppState {
    pub usage_data: Arc<Mutex<UsageData>>,
    pub data_path: String,
}

#[tauri::command]
fn get_usage_data(state: tauri::State<AppState>) -> UsageData {
    match state.usage_data.lock() {
        Ok(guard) => guard.clone(),
        Err(poisoned) => poisoned.into_inner().clone(),
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_current_app() -> Option<String> {
    if let Ok(active_window) = get_active_window() {
        Some(active_window.app_name)
    } else {
        None
    }
}

fn start_tracking_thread(_app_handle: AppHandle, state: Arc<Mutex<UsageData>>, data_path: String) {
    std::thread::spawn(move || {
        let mut save_counter = 0;
        loop {
            std::thread::sleep(Duration::from_secs(1));
            
            let window_result = panic::catch_unwind(|| {
                get_active_window()
            });
            
            if let Ok(Ok(active_window)) = window_result {
                let app_name = active_window.app_name.clone();
                let date_str = Local::now().format("%Y-%m-%d").to_string();
                
                let mut data = match state.lock() {
                    Ok(guard) => guard,
                    Err(poisoned) => poisoned.into_inner(),
                };
                let daily = data.daily_usage.entry(date_str).or_insert_with(HashMap::new);
                let count = daily.entry(app_name).or_insert(0);
                *count += 1;
            }
            
            save_counter += 1;
            if save_counter >= 10 {
                let data = match state.lock() {
                    Ok(guard) => guard,
                    Err(poisoned) => poisoned.into_inner(),
                };
                if let Ok(json) = serde_json::to_string(&*data) {
                    let _ = fs::write(&data_path, json);
                }
                save_counter = 0;
            }
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().expect("failed to get app data dir");
            let _ = fs::create_dir_all(&app_data_dir);
            let data_path = app_data_dir.join("usage_data.json").to_string_lossy().to_string();
            
            let mut initial_data = UsageData::default();
            if let Ok(json) = fs::read_to_string(&data_path) {
                if let Ok(data) = serde_json::from_str::<UsageData>(&json) {
                    initial_data = data;
                }
            }
            
            let usage_data = Arc::new(Mutex::new(initial_data));
            
            app.manage(AppState {
                usage_data: usage_data.clone(),
                data_path: data_path.clone(),
            });
            
            start_tracking_thread(app.handle().clone(), usage_data, data_path);

            let quit_i = MenuItem::with_id(app, "quit", "Çıkış", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Göster", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        std::process::exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, get_usage_data, get_current_app])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
