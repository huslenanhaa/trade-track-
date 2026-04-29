import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Plus, Pencil, Trash2, CalendarDays, Star } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

const EMOTIONS = ["excellent", "good", "neutral", "poor", "terrible"];
const emotionColors = { excellent: "text-green-500", good: "text-green-400", neutral: "text-yellow-500", poor: "text-orange-500", terrible: "text-red-500" };

export default function WeeklyReviewPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const now = new Date();
  const [form, setForm] = useState({
    week_start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    week_end: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    total_trades: 0, total_pnl: 0, win_rate: 0,
    what_went_well: "", what_to_improve: "", goals_next_week: "",
    emotional_state: "neutral", discipline_score: 5, key_lessons: ""
  });
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["weeklyReviews"],
    queryFn: () => appClient.entities.WeeklyReview.list("-week_start"),
  });

  const openForm = (review) => {
    if (review) {
      setEditing(review);
      setForm({ ...review, discipline_score: review.discipline_score || 5 });
    } else {
      setEditing(null);
      setForm({
        week_start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        week_end: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        total_trades: 0, total_pnl: 0, win_rate: 0,
        what_went_well: "", what_to_improve: "", goals_next_week: "",
        emotional_state: "neutral", discipline_score: 5, key_lessons: ""
      });
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    const data = {
      ...form,
      total_trades: parseInt(form.total_trades) || 0,
      total_pnl: parseFloat(form.total_pnl) || 0,
      win_rate: parseFloat(form.win_rate) || 0,
    };
    if (editing?.id) {
      await appClient.entities.WeeklyReview.update(editing.id, data);
    } else {
      await appClient.entities.WeeklyReview.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ["weeklyReviews"] });
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    await appClient.entities.WeeklyReview.delete(id);
    queryClient.invalidateQueries({ queryKey: ["weeklyReviews"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Weekly Review</h1>
          <p className="text-sm text-muted-foreground mt-1">Reflect on your week and set goals</p>
        </div>
        <Button onClick={() => openForm(null)}><Plus className="w-4 h-4 mr-2" />New Review</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <Card className="p-12 text-center">
          <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No weekly reviews yet. Start reflecting to improve.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">
                      {format(new Date(review.week_start), "MMM dd")} — {format(new Date(review.week_end), "MMM dd, yyyy")}
                    </h3>
                    <Badge variant="outline" className={`text-xs capitalize ${emotionColors[review.emotional_state] || ""}`}>
                      {review.emotional_state}
                    </Badge>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-muted-foreground">Trades: <span className="font-medium text-foreground">{review.total_trades}</span></span>
                    <span className="text-muted-foreground">P&L: <span className={`font-medium ${(review.total_pnl || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>${review.total_pnl}</span></span>
                    <span className="text-muted-foreground">Win Rate: <span className="font-medium text-foreground">{review.win_rate}%</span></span>
                    <span className="text-muted-foreground flex items-center gap-1">Discipline: <Star className="w-3 h-3 text-primary" /> {review.discipline_score}/10</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openForm(review)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(review.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {review.what_went_well && (
                  <div className="p-3 rounded-lg bg-green-50 text-sm">
                    <p className="text-xs font-medium text-green-700 mb-1">What went well</p>
                    <p className="text-green-600">{review.what_went_well}</p>
                  </div>
                )}
                {review.what_to_improve && (
                  <div className="p-3 rounded-lg bg-orange-50 text-sm">
                    <p className="text-xs font-medium text-orange-700 mb-1">To improve</p>
                    <p className="text-orange-600">{review.what_to_improve}</p>
                  </div>
                )}
                {review.goals_next_week && (
                  <div className="p-3 rounded-lg bg-blue-50 text-sm">
                    <p className="text-xs font-medium text-blue-700 mb-1">Goals next week</p>
                    <p className="text-blue-600">{review.goals_next_week}</p>
                  </div>
                )}
              </div>
              {review.key_lessons && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50 text-sm">
                  <span className="font-medium">Key Lessons:</span> {review.key_lessons}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Review" : "New Weekly Review"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Week Start</Label>
                <Input type="date" value={form.week_start} onChange={(e) => setForm({ ...form, week_start: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Week End</Label>
                <Input type="date" value={form.week_end} onChange={(e) => setForm({ ...form, week_end: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Total Trades</Label>
                <Input type="number" value={form.total_trades} onChange={(e) => setForm({ ...form, total_trades: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Total P&L ($)</Label>
                <Input type="number" step="0.01" value={form.total_pnl} onChange={(e) => setForm({ ...form, total_pnl: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Win Rate (%)</Label>
                <Input type="number" step="0.1" value={form.win_rate} onChange={(e) => setForm({ ...form, win_rate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Emotional State</Label>
              <Select value={form.emotional_state} onValueChange={(v) => setForm({ ...form, emotional_state: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMOTIONS.map(e => <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Discipline Score: {form.discipline_score}/10</Label>
              <Slider value={[form.discipline_score]} onValueChange={([v]) => setForm({ ...form, discipline_score: v })} max={10} min={1} step={1} className="mt-2" />
            </div>
            <div>
              <Label className="text-xs">What Went Well</Label>
              <Textarea value={form.what_went_well} onChange={(e) => setForm({ ...form, what_went_well: e.target.value })} rows={2} />
            </div>
            <div>
              <Label className="text-xs">What to Improve</Label>
              <Textarea value={form.what_to_improve} onChange={(e) => setForm({ ...form, what_to_improve: e.target.value })} rows={2} />
            </div>
            <div>
              <Label className="text-xs">Goals for Next Week</Label>
              <Textarea value={form.goals_next_week} onChange={(e) => setForm({ ...form, goals_next_week: e.target.value })} rows={2} />
            </div>
            <div>
              <Label className="text-xs">Key Lessons</Label>
              <Textarea value={form.key_lessons} onChange={(e) => setForm({ ...form, key_lessons: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? "Update" : "Save Review"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
