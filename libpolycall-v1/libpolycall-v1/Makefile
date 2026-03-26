# LibPolyCall Library Makefile
# Cross-platform compilation: Windows DLL, Unix/Linux Shared Library, Static Library
#
# Usage:
#   make                    # Build default (debug shared library)
#   make release            # Build optimized version
#   make static             # Build static library
#   make dll                # Build Windows DLL (requires MSVC/MinGW)
#   make clean              # Clean build artifacts
#   make install            # Install library (Unix/Linux only)

# ================================================================
# Project Configuration
# ================================================================

LIBNAME := polycall
VERSION := 2.0.0
PROJECT_NAME := libpolycall

# ================================================================
# Platform Detection
# ================================================================
# Use OS=Windows_NT which is set by Windows itself regardless of
# whether the shell is cmd.exe, PowerShell, or MinGW/conda bash.
# COMSPEC is unreliable in conda/MinGW environments.

ifeq ($(OS),Windows_NT)
    PLATFORM          := Windows
    SHELL             := cmd.exe
    .SHELLFLAGS       := /c
    SHARED_EXT        := .dll
    STATIC_EXT        := .lib
    SHARED_FLAG       := -shared
    POSITION_INDEPENDENT :=
    COMPILER          := gcc
    RM                := del /f /q
    MKDIR             := mkdir
    RMDIR             := rmdir /s /q
    ECHO_CMD          := echo
else
    UNAME_S := $(shell uname -s)

    ifeq ($(UNAME_S),Linux)
        PLATFORM   := Linux
        SHARED_EXT := .so
        SHARED_FLAG := -shared
        POSITION_INDEPENDENT := -fPIC
        COMPILER   := gcc
    endif

    ifeq ($(UNAME_S),Darwin)
        PLATFORM   := macOS
        SHARED_EXT := .dylib
        SHARED_FLAG := -dynamiclib
        POSITION_INDEPENDENT := -fPIC
        COMPILER   := clang
    endif

    RM       := rm -f
    MKDIR    := mkdir -p
    RMDIR    := rm -rf
    ECHO_CMD := echo -e
endif

ifndef PLATFORM
    PLATFORM := Unknown
    COMPILER := gcc
    RM       := rm -f
    MKDIR    := mkdir -p
    RMDIR    := rm -rf
    ECHO_CMD := echo -e
endif

# ================================================================
# Color Codes for Output
# ================================================================
# Windows cmd.exe cannot interpret ANSI escape sequences from
# plain echo, so we use empty color strings on Windows — output
# remains readable without garbled \033[...m noise.
# On Linux/macOS, full ANSI colors are applied via echo -e.

ifeq ($(PLATFORM),Windows)
    RED    :=
    AMBER  :=
    ORANGE :=
    GREEN  :=
    BLUE   :=
    RESET  :=
else
    RED    := \033[91m
    AMBER  := \033[93m
    ORANGE := \033[33m
    GREEN  := \033[92m
    BLUE   := \033[94m
    RESET  := \033[0m
endif

# ================================================================
# Directory Structure
# ================================================================

SRCDIR   := src
INCDIR   := include
OBJDIR   := build/obj
LIBDIR   := build/lib
BINDIR   := build/bin

# ================================================================
# Compiler Flags
# ================================================================

# Basic flags (all platforms)
CFLAGS := -Wall -Wextra -Werror -ffunction-sections -fdata-sections
CFLAGS += -I$(INCDIR)
CFLAGS += -DPOLYCALL_VERSION="\"$(VERSION)\""

# C Standard
CFLAGS += -std=c99 -pedantic

# Visibility/Export handling
ifeq ($(PLATFORM),Windows)
    # Windows DLL export
    EXPORT_FLAG := -DPOLYCALL_DLL_EXPORT
    CFLAGS += $(EXPORT_FLAG)
else
    # Unix/Linux/macOS - hide symbols by default
    CFLAGS += -fvisibility=hidden
endif

# Position Independent Code (for shared libraries)
ifneq ($(POSITION_INDEPENDENT),)
    CFLAGS += $(POSITION_INDEPENDENT)
endif

# Debug vs Release
DEBUG ?= 1
ifeq ($(DEBUG),1)
    CFLAGS += -g -O0 -DDEBUG
    BUILD_TYPE := debug
else
    CFLAGS += -O2 -DNDEBUG
    BUILD_TYPE := release
endif

# ================================================================
# Linker Flags
# ================================================================

LDFLAGS :=

ifeq ($(PLATFORM),Linux)
    LDFLAGS += -Wl,--gc-sections
endif

# ================================================================
# Source Files
# ================================================================

C_SOURCES := $(wildcard $(SRCDIR)/*.c)
HEADERS   := $(wildcard $(INCDIR)/*.h)

# main.c is the executable entry point - exclude it from all library builds
BIN_SRC     := $(SRCDIR)/main.c
LIB_SOURCES := $(filter-out $(BIN_SRC),$(C_SOURCES))

OBJECTS := $(patsubst $(SRCDIR)/%.c,$(OBJDIR)/%.o,$(LIB_SOURCES))

# Library names
STATIC_LIB := $(LIBDIR)/lib$(LIBNAME).a
SHARED_LIB := $(LIBDIR)/lib$(LIBNAME)$(SHARED_EXT)
DLL_EXPORT := $(LIBDIR)/$(LIBNAME).lib

ifeq ($(PLATFORM),Windows)
    SHARED_LIB := $(LIBDIR)/$(LIBNAME).dll
endif

# ================================================================
# DLL Cross-compilation Support
# ================================================================

# Separate object dir for DLL build to avoid mixing .so and .dll objects
DLL_OBJDIR  := build/obj_dll
DLL_OBJECTS := $(patsubst $(SRCDIR)/%.c,$(DLL_OBJDIR)/%.o,$(LIB_SOURCES))
DLL_TARGET  := $(LIBDIR)/$(LIBNAME).dll

# Compiler to use for the DLL target:
#   - On native Windows the normal gcc already targets PE/COFF
#   - On Linux/WSL use the MinGW-w64 cross-compiler
ifeq ($(PLATFORM),Windows)
    DLL_CC := $(COMPILER)
else
    DLL_CC := x86_64-w64-mingw32-gcc
endif

# Strip -fvisibility=hidden (not meaningful for MinGW) and add DLL export flag
DLL_CFLAGS := $(filter-out -fvisibility=hidden,$(CFLAGS)) -DPOLYCALL_DLL_EXPORT

# ================================================================
# Binary (polycall / polycall.exe) from src/main.c
# ================================================================

ifeq ($(PLATFORM),Windows)
    BIN_TARGET  := $(BINDIR)/$(LIBNAME).exe
    BIN_LDFLAGS := -L$(LIBDIR) -l$(LIBNAME) -lws2_32 -lpthread
else
    BIN_TARGET  := $(BINDIR)/$(LIBNAME)
    # -rpath embeds the lib path so the binary finds libpolycall.so at runtime
    BIN_LDFLAGS := -L$(LIBDIR) -l$(LIBNAME) -lpthread -Wl,-rpath,$(LIBDIR)
endif

# ================================================================
# Build Targets
# ================================================================

.PHONY: all debug release static shared dll bin clean distclean install info help

# Default target
all: $(SHARED_LIB)

debug: DEBUG := 1
debug: clean all
	@$(ECHO_CMD) "$(GREEN)OK Built debug shared library: $(SHARED_LIB)$(RESET)"

release: DEBUG := 0
release: clean all
	@$(ECHO_CMD) "$(GREEN)OK Built optimized release library: $(SHARED_LIB)$(RESET)"

static: $(STATIC_LIB)
	@$(ECHO_CMD) "$(GREEN)OK Built static library: $(STATIC_LIB)$(RESET)"

shared: $(SHARED_LIB)
	@$(ECHO_CMD) "$(GREEN)OK Built shared library: $(SHARED_LIB)$(RESET)"

dll: $(DLL_TARGET)
	@$(ECHO_CMD) "$(GREEN)OK Built Windows DLL: $(DLL_TARGET)$(RESET)"

bin: $(BIN_TARGET)
	@$(ECHO_CMD) "$(GREEN)OK Built binary: $(BIN_TARGET)$(RESET)"

# ================================================================
# Compilation Rules
# ================================================================

# Create directories
$(OBJDIR):
	@$(MKDIR) $(OBJDIR)

$(LIBDIR):
	@$(MKDIR) $(LIBDIR)

$(BINDIR):
	@$(MKDIR) $(BINDIR)

# Object file compilation
$(OBJDIR)/%.o: $(SRCDIR)/%.c $(HEADERS) | $(OBJDIR)
	@$(ECHO_CMD) "$(BLUE)  Compiling:$(RESET) $<"
	@$(COMPILER) $(CFLAGS) -c $< -o $@ || ($(ECHO_CMD) "$(RED)FAIL Compilation failed: $<$(RESET)" && exit 1)

# ================================================================
# Library Building
# ================================================================

# Static Library
$(STATIC_LIB): $(OBJECTS) | $(LIBDIR)
	@$(ECHO_CMD) "$(ORANGE)Linking static library:$(RESET) $@"
	@ar rcs $@ $(OBJECTS) || ($(ECHO_CMD) "$(RED)FAIL Linking failed$(RESET)" && exit 1)
	@$(ECHO_CMD) "$(GREEN)OK Static library created:$(RESET) $@"

# Shared Library (Unix/Linux/macOS)
$(SHARED_LIB): $(OBJECTS) | $(LIBDIR)
	@$(ECHO_CMD) "$(ORANGE)Linking shared library:$(RESET) $@"
	@$(COMPILER) $(SHARED_FLAG) $(LDFLAGS) -o $@ $(OBJECTS) || ($(ECHO_CMD) "$(RED)X Linking failed$(RESET)" && exit 1)
	@$(ECHO_CMD) "$(GREEN)OK Shared library created:$(RESET) $@"

# Windows DLL (native or cross-compiled via MinGW-w64 from Linux/WSL)
# Order-only dep on $(LIBDIR) ensures build/ parent exists before we try
# to create build/obj_dll (critical on Windows where mkdir has no -p).
$(DLL_OBJDIR): | $(LIBDIR)
	@$(MKDIR) $(DLL_OBJDIR)

$(DLL_OBJDIR)/%.o: $(SRCDIR)/%.c $(HEADERS) | $(DLL_OBJDIR)
	@$(ECHO_CMD) "$(BLUE)  Compiling (DLL):$(RESET) $<"
	@$(DLL_CC) $(DLL_CFLAGS) -c $< -o $@ || ($(ECHO_CMD) "$(RED)FAIL DLL compilation failed: $<$(RESET)" && exit 1)

$(DLL_TARGET): $(DLL_OBJECTS) | $(LIBDIR)
	@$(ECHO_CMD) "$(ORANGE)Linking Windows DLL:$(RESET) $@"
	@$(DLL_CC) -shared -o $@ $(DLL_OBJECTS) \
		-Wl,--out-implib,$(DLL_EXPORT) \
		|| ($(ECHO_CMD) "$(RED)FAIL DLL linking failed$(RESET)" && exit 1)
	@$(ECHO_CMD) "$(GREEN)OK Windows DLL created:$(RESET) $@"

# Executable binary (build/bin/polycall or build/bin/polycall.exe)
# Requires the shared library to be built first.
$(BIN_TARGET): $(BIN_SRC) $(SHARED_LIB) | $(BINDIR)
	@$(ECHO_CMD) "$(BLUE)  Compiling:$(RESET) $(BIN_SRC)"
	@$(ECHO_CMD) "$(ORANGE)Linking binary:$(RESET) $@"
	@$(COMPILER) $(CFLAGS) $(BIN_SRC) -o $@ $(BIN_LDFLAGS) \
		|| ($(ECHO_CMD) "$(RED)FAIL Binary build failed$(RESET)" && exit 1)
	@$(ECHO_CMD) "$(GREEN)OK Binary created:$(RESET) $@"

# ================================================================
# Installation
# ================================================================

install: $(SHARED_LIB) $(HEADERS)
ifeq ($(PLATFORM),Windows)
	@$(ECHO_CMD) "$(AMBER)WARNING: Installation not supported on Windows$(RESET)"
	@$(ECHO_CMD) "$(AMBER)  Copy $(SHARED_LIB) to your system library path manually$(RESET)"
else
	@$(ECHO_CMD) "$(ORANGE)Installing $(PROJECT_NAME) v$(VERSION)...$(RESET)"
	@install -d /usr/local/lib
	@install -d /usr/local/include/$(PROJECT_NAME)
	@install -m 755 $(SHARED_LIB) /usr/local/lib/
	@install -m 644 $(HEADERS) /usr/local/include/$(PROJECT_NAME)/
	@$(ECHO_CMD) "$(GREEN)OK Installed to /usr/local/lib/ and /usr/local/include/$(PROJECT_NAME)/$(RESET)"

endif

# ================================================================
# Cleaning
# ================================================================

clean:
	@$(ECHO_CMD) "$(ORANGE)Cleaning build artifacts...$(RESET)"
	-@$(RMDIR) build
	@$(ECHO_CMD) "$(GREEN)Clean complete$(RESET)"

distclean: clean
	@$(ECHO_CMD) "$(ORANGE)Removing generated files...$(RESET)"
	-@$(RM) *~ *.swp
	@$(ECHO_CMD) "$(GREEN)Distribution clean complete$(RESET)"

# ================================================================
# Information and Help
# ================================================================

info:
	@$(ECHO_CMD) "$(BLUE)LibPolyCall Build Configuration$(RESET)"
	@$(ECHO_CMD) "$(BLUE)================================$(RESET)"
	@$(ECHO_CMD) "$(GREEN)Platform:$(RESET)      $(PLATFORM)"
	@$(ECHO_CMD) "$(GREEN)Compiler:$(RESET)      $(COMPILER)"
	@$(ECHO_CMD) "$(GREEN)Build Type:$(RESET)    $(BUILD_TYPE)"
	@$(ECHO_CMD) "$(GREEN)Library Name:$(RESET)  $(LIBNAME)"
	@$(ECHO_CMD) "$(GREEN)Version:$(RESET)       $(VERSION)"
	@$(ECHO_CMD) ""
	@$(ECHO_CMD) "$(GREEN)Source Files:$(RESET)  $(C_SOURCES)"
	@$(ECHO_CMD) "$(GREEN)Header Files:$(RESET)  $(HEADERS)"

help:
	@$(ECHO_CMD) "$(BLUE)LibPolyCall Library - Build Targets$(RESET)"
	@$(ECHO_CMD) "$(BLUE)=====================================$(RESET)"
	@$(ECHO_CMD) ""
	@$(ECHO_CMD) "  $(GREEN)make [all]$(RESET)        Build default (debug shared library)"
	@$(ECHO_CMD) "  $(GREEN)make debug$(RESET)        Build debug version with symbols"
	@$(ECHO_CMD) "  $(GREEN)make release$(RESET)      Build optimized release version"
	@$(ECHO_CMD) "  $(GREEN)make static$(RESET)       Build static library (.a / .lib)"
	@$(ECHO_CMD) "  $(GREEN)make shared$(RESET)       Build shared library (.so / .dylib / .dll)"
	@$(ECHO_CMD) "  $(GREEN)make dll$(RESET)          Build Windows DLL explicitly"
	@$(ECHO_CMD) "  $(GREEN)make bin$(RESET)          Build executable (build/bin/polycall[.exe])"
	@$(ECHO_CMD) ""
	@$(ECHO_CMD) "  $(ORANGE)make install$(RESET)      Install library (Unix/Linux only)"
	@$(ECHO_CMD) "  $(AMBER)make clean$(RESET)        Remove build artifacts"
	@$(ECHO_CMD) "  $(RED)make distclean$(RESET)    Remove all generated files"
	@$(ECHO_CMD) ""
	@$(ECHO_CMD) "  $(BLUE)make info$(RESET)         Show build configuration"
	@$(ECHO_CMD) "  $(BLUE)make help$(RESET)         This help message"
	@$(ECHO_CMD) ""
	@$(ECHO_CMD) "$(ORANGE)Examples:$(RESET)"
	@$(ECHO_CMD) "  $$ make                  # Build default (shared, debug)"
	@$(ECHO_CMD) "  $$ make release static   # Build static release library"
	@$(ECHO_CMD) "  $$ make dll              # Build Windows DLL"
	@$(ECHO_CMD) "  $$ make install          # Install on Unix/Linux"

.DEFAULT_GOAL := help
.PHONY: info help

