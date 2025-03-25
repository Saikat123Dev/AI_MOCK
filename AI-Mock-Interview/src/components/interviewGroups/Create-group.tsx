"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Difficulty = "easy" | "medium" | "hard";
type Experience = "0-1" | "1-3" | "3-5" | "5-10" | "10+";

const CreateInterviewGroup = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("12:00");

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    skills: [] as string[],
    experience: "" as Experience,
    difficulty: "medium" as Difficulty,
    questionNo: 5,
    timeLimit: 60,
  });

  const [skillInput, setSkillInput] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Group name is required";
    if (!formData.role.trim()) errors.role = "Job role is required";
    if (formData.skills.length === 0) errors.skills = "At least one skill is required";
    if (!formData.experience) errors.experience = "Experience level is required";
    if (!date) errors.date = "Interview date is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Combine date and time
    if (!date) return;
    const dateTime = new Date(date);
    const [hours, minutes] = time.split(":").map(Number);
    dateTime.setHours(hours, minutes);

    setIsLoading(true);

    try {
      const response = await fetch("/api/interview-groups/create-group", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          dateTime: dateTime.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create interview group");
      }

      toast.success("Interview group created successfully");

      // Redirect to the new group details page
      router.push(`/interview-groups/${data.group.id}`);
    } catch (error) {
      console.error("Error creating interview group:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create interview group");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Interview Group</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Group Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Group Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter group name"
            className={cn(formErrors.name && "border-red-500")}
            aria-invalid={!!formErrors.name}
            aria-describedby={formErrors.name ? "name-error" : undefined}
          />
          {formErrors.name && (
            <p id="name-error" className="text-sm text-red-500">
              {formErrors.name}
            </p>
          )}
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Interview Date <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                    formErrors.date && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
              <Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  initialFocus
  disabled={(date) => {
    // Create a new date with time set to beginning of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Compare only the date portion, not the time
    return date < today;
  }}
/>
              </PopoverContent>
            </Popover>
            {formErrors.date && (
              <p className="text-sm text-red-500">{formErrors.date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="time" className="text-sm font-medium">
              Interview Time
            </Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Job Role */}
        <div className="space-y-2">
          <Label htmlFor="role" className="text-sm font-medium">
            Job Role <span className="text-red-500">*</span>
          </Label>
          <Input
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            placeholder="e.g., Frontend Developer"
            className={cn(formErrors.role && "border-red-500")}
          />
          {formErrors.role && (
            <p className="text-sm text-red-500">{formErrors.role}</p>
          )}
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Required Skills <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="e.g., React"
              className={cn(formErrors.skills && "border-red-500")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleAddSkill}
              variant="secondary"
            >
              Add
            </Button>
          </div>
          {formErrors.skills && (
            <p className="text-sm text-red-500">{formErrors.skills}</p>
          )}

          {formData.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.skills.map((skill) => (
                <div
                  key={skill}
                  className="bg-violet-100 text-violet-800 px-3 py-1 rounded-full flex items-center gap-1"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-violet-600 hover:text-violet-800 focus:outline-none"
                    aria-label={`Remove ${skill}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Experience Level */}
        <div className="space-y-2">
          <Label htmlFor="experience" className="text-sm font-medium">
            Experience Level <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.experience}
            onValueChange={(value) =>
              setFormData({ ...formData, experience: value as Experience })
            }
          >
            <SelectTrigger
              className={cn(formErrors.experience && "border-red-500")}
              id="experience"
            >
              <SelectValue placeholder="Select experience level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-1">0-1 years</SelectItem>
              <SelectItem value="1-3">1-3 years</SelectItem>
              <SelectItem value="3-5">3-5 years</SelectItem>
              <SelectItem value="5-10">5-10 years</SelectItem>
              <SelectItem value="10+">10+ years</SelectItem>
            </SelectContent>
          </Select>
          {formErrors.experience && (
            <p className="text-sm text-red-500">{formErrors.experience}</p>
          )}
        </div>

        {/* Difficulty Level */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Difficulty Level</Label>
          <RadioGroup
            value={formData.difficulty}
            onValueChange={(value) =>
              setFormData({ ...formData, difficulty: value as Difficulty })
            }
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="easy" id="easy" />
              <Label htmlFor="easy" className="cursor-pointer">Easy</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="medium" />
              <Label htmlFor="medium" className="cursor-pointer">Medium</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hard" id="hard" />
              <Label htmlFor="hard" className="cursor-pointer">Hard</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Number of Questions */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="questionNo" className="text-sm font-medium">
              Number of Questions
            </Label>
            <span className="text-sm text-gray-500">{formData.questionNo}</span>
          </div>
          <Slider
            id="questionNo"
            min={1}
            max={20}
            step={1}
            value={[formData.questionNo]}
            onValueChange={(value) =>
              setFormData({ ...formData, questionNo: value[0] })
            }
            className="py-4"
          />
        </div>

        {/* Time Limit */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="timeLimit" className="text-sm font-medium">
              Time Limit (minutes)
            </Label>
            <span className="text-sm text-gray-500">{formData.timeLimit}</span>
          </div>
          <Slider
            id="timeLimit"
            min={15}
            max={180}
            step={5}
            value={[formData.timeLimit]}
            onValueChange={(value) =>
              setFormData({ ...formData, timeLimit: value[0] })
            }
            className="py-4"
          />
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Interview Group"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => router.push("/interview-groups")}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateInterviewGroup;
